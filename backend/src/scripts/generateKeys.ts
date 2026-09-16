import path from 'node:path';
import { ensureKeyFilesExist } from '../utils/cryptoSigner';

function main() {
    const keysDir = path.resolve(__dirname, '..', '..', 'keys');
    const privPath = path.join(keysDir, 'license-private.pem');
    const pubPath = path.join(keysDir, 'license-public.pem');

    console.log('🔐 [Spoorf Cloud] Generating / verifying RSA 2048-bit keypair in:', keysDir);
    const keypair = ensureKeyFilesExist(privPath, pubPath, 2048);

    console.log('✅ [Spoorf Cloud] Keys ready:');
    console.log('   - Private Key:', privPath);
    console.log('   - Public Key :', pubPath);
    console.log('\n--- PUBLIC KEY PREVIEW ---');
    console.log(keypair.publicKey.trim());
    console.log('--------------------------');
}

main();