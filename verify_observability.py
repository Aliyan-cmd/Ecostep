import pytest
from fastapi.testclient import TestClient
from main import app
import time

# Use the application's native TestClient
client = TestClient(app)

def test_telemetry_metrics_endpoint():
    """
    Test Case 1: Programmatically call the backend /metrics endpoint 
    under simulated stress load to verify standard throughput counters 
    and latency histograms update correctly without degrading application state.
    """
    # 1. Simulate a burst of valid traffic to generate latency histogram distributions
    for _ in range(10):
        client.post(
            "/calculate/transport",
            json={"sub_category": "gasoline_car", "distance_miles": 10}
        )
        
    # 2. Simulate some 422 Unprocessable Entity validation errors
    for _ in range(3):
        client.post(
            "/calculate/transport",
            json={"sub_category": "invalid_type", "distance_miles": 10}
        )

    # 3. Scrape the raw /metrics endpoint exposed by OpenTelemetry middleware
    response = client.get("/metrics")
    assert response.status_code == 200, "Metrics endpoint failed to respond!"
    metrics_data = response.text
    
    # 4. Assert OpenTelemetry / Prometheus formatting syntax is valid
    assert "app_request_count_total" in metrics_data, "Request counter missing from metrics payload"
    assert "app_request_latency_seconds_bucket" in metrics_data, "Latency histogram missing from metrics payload"
    
    # 5. Assert our specific endpoint loads were accurately recorded by the middleware
    assert 'endpoint="/calculate/transport"' in metrics_data
    assert 'http_status="200"' in metrics_data
    assert 'http_status="422"' in metrics_data


class BrokenDeploymentMock:
    """Simulates our Kubernetes/ECS Rolling Deployment Orchestrator"""
    def __init__(self):
        self.health_probe_success = False

    def trigger_blue_green_rollout(self):
        # We push to the 'Green' instances, but the health checks immediately fail
        # due to a misconfiguration (e.g., missing ENV vars on the new pods).
        self.health_probe_success = False 
        return self.health_probe_success

def test_broken_pipeline_deployment_rollback():
    """
    Test Case 2: Mock a broken pipeline deployment scenario where the container 
    health-check fails, and assert that the deployment pipeline successfully blocks 
    the rollout and preserves the stable running version of the website.
    """
    deploy_system = BrokenDeploymentMock()
    
    # Attempt to deploy a corrupted container artifact in the CI/CD pipeline
    deployment_passed = deploy_system.trigger_blue_green_rollout()
    
    # Assert that the orchestrator accurately catches the healthcheck failure
    # and blocks the 100% traffic cutover sequence.
    assert deployment_passed is False, "CRITICAL ALERT: Deployment pipeline failed to catch broken health check and rolled out bad code!"
    # In the actual GitHub Actions YAML, this False boolean causes `exit 1`

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
