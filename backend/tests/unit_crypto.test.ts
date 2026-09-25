import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import {
    generateRsaKeyPair,
    ensureKeyFilesExist,
    CryptoSigner,
    LicenseTokenPayload
} from '../src/utils/cryptoSigner';

describe('RS256 Asymmetric Cryptography & License Signer Suite', () => {
    const testKeysDir = path.join(__dirname, 'temp_keys');
    const testPrivKeyPath = path.join(testKeysDir, 'test-private.pem');
    const testPubKeyPath = path.join(testKeysDir, 'test-public.pem');

    before(() => {
        if (!fs.existsSync(testKeysDir)) {
            fs.mkdirSync(testKeysDir, { recursive: true });
        }
    });

    after(() => {
        if (fs.existsSync(testKeysDir)) {
            fs.rmSync(testKeysDir, { recursive: true, force: true });
        }
    });

    test('1. generateRsaKeyPair produces valid RSA 2048-bit PKCS#8 and SPKI PEM keys', () => {
        const { privateKey, publicKey } = generateRsaKeyPair(2048);
        assert.ok(privateKey.includes('-----BEGIN PRIVATE KEY-----'));
        assert.ok(privateKey.includes('-----END PRIVATE KEY-----'));
        assert.ok(publicKey.includes('-----BEGIN PUBLIC KEY-----'));
        assert.ok(publicKey.includes('-----END PUBLIC KEY-----'));
    });

    test('2. ensureKeyFilesExist saves keys to disk idempotently and loadKeys loads them', () => {
        assert.equal(fs.existsSync(testPrivKeyPath), false);
        assert.equal(fs.existsSync(testPubKeyPath), false);

        ensureKeyFilesExist(testPrivKeyPath, testPubKeyPath);

        assert.equal(fs.existsSync(testPrivKeyPath), true);
        assert.equal(fs.existsSync(testPubKeyPath), true);

        const privContent = fs.readFileSync(testPrivKeyPath, 'utf8');
        const pubContent = fs.readFileSync(testPubKeyPath, 'utf8');

        // Calling again should not overwrite existing keys
        ensureKeyFilesExist(testPrivKeyPath, testPubKeyPath);
        const privContentAfter = fs.readFileSync(testPrivKeyPath, 'utf8');
        assert.equal(privContent, privContentAfter);

        const signer = new CryptoSigner({
            privateKeyPath: testPrivKeyPath,
            publicKeyPath: testPubKeyPath
        });

        assert.ok(signer.getPublicKey().includes('-----BEGIN PUBLIC KEY-----'));
    });

    test('3. signLicenseToken signs valid RS256 token and verifyLicenseToken decodes full payload', () => {
        const signer = new CryptoSigner({
            privateKeyPath: testPrivKeyPath,
            publicKeyPath: testPubKeyPath
        });

        const payload: LicenseTokenPayload = {
            userId: 'usr_test_123',
            email: 'hanif@spoorf.app',
            tier: 'pro',
            maxCuts: 999,
            canThrottle: true,
            canGateway: true,
            canAutoreblock: true,
            canArsenal: false,
            sessionId: 'sess-uuid-456'
        };

        const token = signer.signLicenseToken(payload, { expiresIn: '7d' });
        assert.ok(typeof token === 'string' && token.length > 50);

        // Header check
        const decodedHeader = jwt.decode(token, { complete: true });
        assert.equal(decodedHeader?.header.alg, 'RS256');
        assert.equal(decodedHeader?.header.typ, 'JWT');

        // Verify and decode
        const verified = signer.verifyLicenseToken(token);
        assert.equal(verified.userId, 'usr_test_123');
        assert.equal(verified.email, 'hanif@spoorf.app');
        assert.equal(verified.tier, 'pro');
        assert.equal(verified.maxCuts, 999);
        assert.equal(verified.canThrottle, true);
        assert.equal(verified.canGateway, true);
        assert.equal(verified.canAutoreblock, true);
        assert.equal(verified.canArsenal, false);
        assert.equal(verified.sessionId, 'sess-uuid-456');
        assert.equal(verified.iss, 'https://api.spoorf.app');
        assert.ok(typeof verified.jti === 'string');
    });

    test('4. Security: detects tampered token payload and throws JsonWebTokenError', () => {
        const signer = new CryptoSigner({
            privateKeyPath: testPrivKeyPath,
            publicKeyPath: testPubKeyPath
        });

        const payload: LicenseTokenPayload = {
            userId: 'usr_normal',
            email: 'user@spoorf.app',
            tier: 'free',
            maxCuts: 5,
            canThrottle: false,
            canGateway: false,
            canAutoreblock: false,
            canArsenal: false
        };

        const token = signer.signLicenseToken(payload);
        const parts = token.split('.');

        // Tamper payload: change tier from free to vip
        const payloadJson = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        payloadJson.tier = 'vip';
        payloadJson.maxCuts = 9999;
        const tamperedPayloadB64 = Buffer.from(JSON.stringify(payloadJson)).toString('base64url');
        const tamperedToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;

        assert.throws(() => {
            signer.verifyLicenseToken(tamperedToken);
        }, /invalid signature/i);
    });

    test('5. Security: algorithm substitution defense (rejects HS256/HMAC or non-RS256 tokens)', () => {
        const signer = new CryptoSigner({
            privateKeyPath: testPrivKeyPath,
            publicKeyPath: testPubKeyPath
        });

        // Attacker creates HS256 token using public key as secret
        const pubKey = signer.getPublicKey();
        const fakeToken = jwt.sign(
            { userId: 'usr_hacker', tier: 'vip', iss: 'https://api.spoorf.app' },
            pubKey,
            { algorithm: 'HS256' }
        );

        assert.throws(() => {
            signer.verifyLicenseToken(fakeToken);
        }, /invalid algorithm/i);
    });

    test('6. Security: rejects expired token', () => {
        const signer = new CryptoSigner({
            privateKeyPath: testPrivKeyPath,
            publicKeyPath: testPubKeyPath
        });

        const token = signer.signLicenseToken(
            {
                userId: 'usr_exp',
                email: 'exp@spoorf.app',
                tier: 'free',
                maxCuts: 5,
                canThrottle: false,
                canGateway: false,
                canAutoreblock: false,
                canArsenal: false
            },
            { expiresIn: '-1s' } // already expired
        );

        assert.throws(() => {
            signer.verifyLicenseToken(token);
        }, /jwt expired/i);
    });

    test('7. ensureKeyFilesExist never replaces a keypair when one half is missing', () => {
        for (const missing of ['public', 'private'] as const) {
            const dir = path.join(testKeysDir, `partial-${missing}`);
            const privPath = path.join(dir, 'private.pem');
            const pubPath = path.join(dir, 'public.pem');
            const original = ensureKeyFilesExist(privPath, pubPath);
            const survivorPath = missing === 'public' ? privPath : pubPath;
            fs.unlinkSync(missing === 'public' ? pubPath : privPath);

            assert.throws(() => ensureKeyFilesExist(privPath, pubPath), /only one half of the RSA keypair/i);

            const survivor = missing === 'public' ? original.privateKey : original.publicKey;
            assert.equal(fs.readFileSync(survivorPath, 'utf8'), survivor, `${missing} missing: surviving key must be untouched`);
        }
    });

    test('8. ensureKeyFilesExist does not generate keys when generation is disabled', () => {
        const dir = path.join(testKeysDir, 'no-generate');
        const privPath = path.join(dir, 'private.pem');
        const pubPath = path.join(dir, 'public.pem');

        assert.throws(() => ensureKeyFilesExist(privPath, pubPath, 2048, { allowGenerate: false }), /RSA keypair not found/i);
        assert.equal(fs.existsSync(privPath), false);
        assert.equal(fs.existsSync(pubPath), false);
    });

    test('9. CryptoSigner refuses to generate a keypair in production', () => {
        const dir = path.join(testKeysDir, 'production');
        const previousEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            assert.throws(
                () => new CryptoSigner({
                    privateKeyPath: path.join(dir, 'private.pem'),
                    publicKeyPath: path.join(dir, 'public.pem')
                }),
                /RSA keypair not found/i
            );
        } finally {
            process.env.NODE_ENV = previousEnv;
        }
        assert.equal(fs.existsSync(path.join(dir, 'private.pem')), false);
    });
});
