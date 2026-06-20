import pytest
import os
import re

# Import the encryption engine strictly from the source module
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from security.crypto import DataEncryptionEngine, DecryptionError

def test_encryption_integrity_failure():
    """
    Test Case 2: Verify that attempting to ingest an encrypted activity payload 
    with an invalid/tampered token safely fails via DecryptionError.
    """
    # Initialize engine dynamically (simulating KMS retrieval at startup)
    engine = DataEncryptionEngine()
    
    # 1. Encrypt a valid secret (e.g. a bank auth token)
    secret_token = "oauth_token_12345_secure"
    encrypted_payload = engine.encrypt_field(secret_token)
    
    # 2. Prove it decrypts successfully under normal operating conditions
    assert engine.decrypt_field(encrypted_payload) == secret_token
    
    # 3. Simulate a man-in-the-middle or database corruption (tamper the payload)
    # Convert base64 back, flip a byte, and re-encode
    import base64
    raw_bytes = bytearray(base64.b64decode(encrypted_payload))
    # Flip a single bit in the ciphertext segment
    raw_bytes[-1] = raw_bytes[-1] ^ 0x01
    tampered_payload = base64.b64encode(raw_bytes).decode('utf-8')
    
    # 4. Assert that the AES-256 GCM authentication tag validation strictly fails
    with pytest.raises(DecryptionError) as exc_info:
        engine.decrypt_field(tampered_payload)
        
    assert "Decryption failed" in str(exc_info.value) or "Data integrity compromised" in str(exc_info.value)


def test_nginx_security_headers_configuration():
    """
    Test Case 1: Programmatically assert that the Nginx configuration
    injects required strict security headers to shield against XSS and clickjacking.
    """
    config_path = os.path.join(os.path.dirname(__file__), "nginx", "nginx.conf")
    
    with open(config_path, "r") as f:
        config_content = f.read()
        
    # Check for Strict-Transport-Security (HSTS)
    assert re.search(r'add_header\s+Strict-Transport-Security\s+"max-age=31536000;\s*includeSubDomains"\s*always;', config_content), "Critical Failure: HSTS header missing or misconfigured in Nginx"
    
    # Check for X-Frame-Options DENY
    assert re.search(r'add_header\s+X-Frame-Options\s+"DENY"\s*always;', config_content), "Critical Failure: X-Frame-Options DENY missing (Clickjacking vector exposed)"
    
    # Check for X-Content-Type-Options nosniff
    assert re.search(r'add_header\s+X-Content-Type-Options\s+"nosniff"\s*always;', config_content), "Critical Failure: X-Content-Type-Options nosniff missing"
    
    # Check for strict CSP
    assert "Content-Security-Policy" in config_content, "Critical Failure: Content-Security-Policy is entirely missing"
    assert "default-src 'self'" in config_content, "Critical Failure: CSP does not restrict default-src to 'self'"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
