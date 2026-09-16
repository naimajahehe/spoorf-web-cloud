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
 * Ensure RSA key files exist on disk idempotently.
 * Creates parent directory and saves files if not already present.
 */
export function ensureKeyFilesExist(
    privateKeyPath: string,
    publicKeyPath: string,
    modulusLength: number = 2048
): KeyPairPem {
    const privExists = fs.existsSync(privateKeyPath);
    const pubExists = fs.existsSync(publicKeyPath);

    if (privExists && pubExists) {
        return {
            privateKey: fs.readFileSync(privateKeyPath, 'utf8'),
            publicKey: fs.readFileSync(publicKeyPath, 'utf8')
        };
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

            const keys = ensureKeyFilesExist(privPath, pubPath);
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
            expiresIn: (options.expiresIn as any) || '30d'
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