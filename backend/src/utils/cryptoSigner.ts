import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface LicenseTokenPayload {
    userId: string;
    email: string;
    tier: 'free' | 'pro' | 'vip';
    maxCuts: number;
    canThrottle: boolean;
    canGateway: boolean;
    canAutoreblock: boolean;
    canArsenal: boolean;
    sessionId?: string;
    expiresAt?: string | null;
    gracePeriodUntil?: string | null;
    [key: string]: any;
}

export interface KeyPairPem {
    privateKey: string;
    publicKey: string;
}

export interface CryptoSignerOptions {
    privateKeyPath?: string;
    publicKeyPath?: string;
    privateKeyPem?: string;
    publicKeyPem?: string;
    issuer?: string;
}

/**
 * Generate cryptographic RSA keypair in PEM format (PKCS#8 and SPKI).
 */
export function generateRsaKeyPair(modulusLength: number = 2048): KeyPairPem {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    return { privateKey, publicKey };
}

/**
 * Load the RSA keypair from disk, generating it only when neither file exists.
 * Desktop builds embed the public key, so an existing keypair is never replaced:
 * a lone half is an error, and `allowGenerate: false` forbids creating a new pair.
 */
export function ensureKeyFilesExist(
    privateKeyPath: string,
    publicKeyPath: string,
    modulusLength: number = 2048,
    options: { allowGenerate?: boolean } = {}
): KeyPairPem {
    const privExists = fs.existsSync(privateKeyPath);
    const pubExists = fs.existsSync(publicKeyPath);

    if (privExists && pubExists) {
        return {
            privateKey: fs.readFileSync(privateKeyPath, 'utf8'),
            publicKey: fs.readFileSync(publicKeyPath, 'utf8')
        };
    }

    if (privExists || pubExists) {
        throw new Error(
            `[Crypto] Found only one half of the RSA keypair (missing: ${privExists ? publicKeyPath : privateKeyPath}). ` +
            'Refusing to generate a new keypair because it would replace the signing key trusted by desktop clients. ' +
            'Restore the missing file.'
        );
    }

    if (options.allowGenerate === false) {
        throw new Error(
            `[Crypto] RSA keypair not found at ${privateKeyPath} and ${publicKeyPath}, and generating one is disabled here. ` +
            'Provision the keypair whose public key is embedded in the desktop builds.'
        );
    }

    const dirPrivate = path.dirname(privateKeyPath);
    const dirPublic = path.dirname(publicKeyPath);

    if (!fs.existsSync(dirPrivate)) {
        fs.mkdirSync(dirPrivate, { recursive: true });
    }
    if (!fs.existsSync(dirPublic)) {
        fs.mkdirSync(dirPublic, { recursive: true });
    }

    const keypair = generateRsaKeyPair(modulusLength);

    fs.writeFileSync(privateKeyPath, keypair.privateKey, { encoding: 'utf8', mode: 0o600 });
    fs.writeFileSync(publicKeyPath, keypair.publicKey, { encoding: 'utf8', mode: 0o644 });

    return keypair;
}

/** Lifetime of a signed license token. Session cleanup relies on this same value. */
export const LICENSE_TOKEN_TTL_DAYS = 30;

/**
 * Production RS256 Asymmetric License Token Signer & Verifier.
 */
export class CryptoSigner {
    private privateKeyPem: string;
    private publicKeyPem: string;
    private issuer: string;

    constructor(options: CryptoSignerOptions = {}) {
        this.issuer = options.issuer || process.env.JWT_ISSUER || 'https://api.spoorf.app';

        if (options.privateKeyPem && options.publicKeyPem) {
            this.privateKeyPem = options.privateKeyPem;
            this.publicKeyPem = options.publicKeyPem;
        } else {
            const privPath = options.privateKeyPath ||
                process.env.JWT_PRIVATE_KEY_PATH ||
                path.resolve(process.cwd(), 'keys', 'license-private.pem');
            const pubPath = options.publicKeyPath ||
                process.env.JWT_PUBLIC_KEY_PATH ||
                path.resolve(process.cwd(), 'keys', 'license-public.pem');

            // A generated key is never the one desktop builds trust, so production must provide it.
            const keys = ensureKeyFilesExist(privPath, pubPath, 2048, {
                allowGenerate: process.env.NODE_ENV !== 'production'
            });
            this.privateKeyPem = keys.privateKey;
            this.publicKeyPem = keys.publicKey;
        }
    }

    public getPublicKey(): string {
        return this.publicKeyPem;
    }

    public getPrivateKey(): string {
        return this.privateKeyPem;
    }

    /**
     * Signs a license token payload with RS256 private key.
     */
    public signLicenseToken(
        payload: LicenseTokenPayload,
        options: { expiresIn?: string | number } = {}
    ): string {
        const signOptions: SignOptions = {
            algorithm: 'RS256',
            issuer: this.issuer,
            jwtid: crypto.randomUUID(),
            expiresIn: (options.expiresIn as any) || `${LICENSE_TOKEN_TTL_DAYS}d`
        };

        return jwt.sign(payload, this.privateKeyPem, signOptions);
    }

    /**
     * Verifies an RS256 license token with the public key.
     * Enforces strict algorithm lockdown: only RS256 is accepted.
     */
    public verifyLicenseToken(token: string): LicenseTokenPayload & jwt.JwtPayload {
        const verifyOptions: VerifyOptions = {
            algorithms: ['RS256'],
            issuer: this.issuer
        };

        return jwt.verify(token, this.publicKeyPem, verifyOptions) as LicenseTokenPayload & jwt.JwtPayload;
    }
}

let defaultSignerInstance: CryptoSigner | null = null;

export function getDefaultCryptoSigner(): CryptoSigner {
    if (!defaultSignerInstance) {
        defaultSignerInstance = new CryptoSigner();
    }
    return defaultSignerInstance;
}