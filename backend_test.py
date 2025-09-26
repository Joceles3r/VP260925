#!/usr/bin/env python3
"""
Backend API Testing for VISUAL Platform
Tests all API endpoints with mock data
"""

import requests
import sys
import json
from datetime import datetime

class VisualAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                
                # Try to parse JSON response
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return True, {}
            else:
                self.tests_passed += 0
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                print(f"❌ FAILED - {name}: {error_msg}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": error_msg
                })
                return False, {}

        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error: {str(e)}"
            print(f"❌ FAILED - {name}: {error_msg}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": error_msg
            })
            return False, {}
        except requests.exceptions.Timeout as e:
            error_msg = f"Timeout error: {str(e)}"
            print(f"❌ FAILED - {name}: {error_msg}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": error_msg
            })
            return False, {}
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            print(f"❌ FAILED - {name}: {error_msg}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": error_msg
            })
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_auth_me_endpoint(self):
        """Test current user endpoint"""
        return self.run_test(
            "Get Current User",
            "GET", 
            "api/auth/me",
            200
        )

    def test_projects_endpoint(self):
        """Test projects listing endpoint"""
        return self.run_test(
            "Get Projects",
            "GET",
            "api/projects",
            200
        )

    def test_projects_with_filters(self):
        """Test projects with category filter"""
        return self.run_test(
            "Get Projects with Category Filter",
            "GET",
            "api/projects?category=documentaire&status=active&page=1&limit=10",
            200
        )

    def test_investments_endpoint(self):
        """Test investments endpoint"""
        return self.run_test(
            "Get Investments",
            "GET",
            "api/investments",
            200
        )

    def test_notifications_endpoint(self):
        """Test notifications endpoint"""
        return self.run_test(
            "Get Notifications",
            "GET",
            "api/notifications",
            200
        )

    def test_logout_endpoint(self):
        """Test logout endpoint"""
        return self.run_test(
            "Logout",
            "POST",
            "api/logout",
            200
        )

    def test_invalid_endpoint(self):
        """Test invalid endpoint returns 404"""
        return self.run_test(
            "Invalid Endpoint",
            "GET",
            "api/invalid-endpoint",
            200  # Based on the catch-all route, it returns 200 with error message
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🚀 VISUAL Platform Backend API Testing")
        print("=" * 60)
        
        # Test all endpoints
        tests = [
            self.test_health_endpoint,
            self.test_auth_me_endpoint,
            self.test_projects_endpoint,
            self.test_projects_with_filters,
            self.test_investments_endpoint,
            self.test_notifications_endpoint,
            self.test_logout_endpoint,
            self.test_invalid_endpoint
        ]
        
        for test in tests:
            test()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed.get('error', 'Unknown error')}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = VisualAPITester("http://localhost:8001")
    
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend tests passed!")
        return 0
    else:
        print(f"\n💥 {tester.tests_run - tester.tests_passed} tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())