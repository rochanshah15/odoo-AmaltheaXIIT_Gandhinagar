import requests
import json

# Test the registration endpoint
def test_registration():
    url = "http://127.0.0.1:8000/api/auth/register/"
    
    data = {
        "username": "testadmin",
        "email": "admin@test.com",
        "password": "testpass123",
        "confirm_password": "testpass123",
        "first_name": "Test",
        "last_name": "Admin",
        "country": "United States"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            user_data = response.json()
            print(f"User Role: {user_data['user']['role']}")
            print(f"Company ID: {user_data['user']['company_id']}")
        else:
            print("❌ Registration failed!")
            
    except Exception as e:
        print(f"Error: {e}")

# Test the login endpoint
def test_login():
    url = "http://127.0.0.1:8000/api/auth/login/"
    
    data = {
        "email": "admin@test.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            user_data = response.json()
            print(f"User Role: {user_data['user']['role']}")
            print(f"Access Token: {user_data['access'][:50]}...")
        else:
            print("❌ Login failed!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Registration...")
    test_registration()
    print("\nTesting Login...")
    test_login()