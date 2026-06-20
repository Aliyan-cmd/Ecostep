import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

class DecryptionError(Exception):
    """Raised when decryption fails due to invalid tags or corrupted data."""
    pass

class DataEncryptionEngine:
    """
    AES-256-GCM symmetric encryption utility for securing database fields.
    
    Methodology: 
    - The `master_key` represents a Data Encryption Key (DEK). 
    - In production, this DEK would be generated and encrypted by a Cloud KMS Key Encryption Key (KEK).
    - The application retrieves the encrypted DEK, decrypts it via KMS at startup, and loads it into memory here.
    """
    
    def __init__(self, master_key_base64: str = None):
        # Generate a new 256-bit key if none provided (for testing/dev purposes)
        if master_key_base64:
            self._key = base64.b64decode(master_key_base64)
        else:
            self._key = AESGCM.generate_key(bit_length=256)
        
        self.aesgcm = AESGCM(self._key)

    def encrypt_field(self, plaintext: str) -> str:
        """Encrypts a string and returns a base64 encoded ciphertext including the nonce."""
        nonce = os.urandom(12)  # 96-bit nonce recommended for GCM mode
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        # Prepend nonce to ciphertext so it can be extracted during decryption
        encrypted_payload = nonce + ciphertext
        return base64.b64encode(encrypted_payload).decode('utf-8')

    def decrypt_field(self, b64_encrypted_payload: str) -> str:
        """Decrypts a base64 encoded payload. Raises DecryptionError on tampering or corruption."""
        try:
            encrypted_payload = base64.b64decode(b64_encrypted_payload)
            nonce = encrypted_payload[:12]
            ciphertext = encrypted_payload[12:]
            plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
            return plaintext.decode('utf-8')
        except InvalidTag:
            raise DecryptionError("Data integrity compromised. Invalid authentication tag.")
        except Exception as e:
            raise DecryptionError(f"Decryption failed: {str(e)}")

# Instantiate a global instance for the application (mocking a KMS injected key for local runs)
# In production, this env var must be strictly injected by the Kubernetes secret or orchestrator.
_test_key = base64.b64encode(AESGCM.generate_key(bit_length=256)).decode('utf-8')
crypto_engine = DataEncryptionEngine(os.getenv("ECOSTEP_DEK", _test_key))
