// Test script cho Custom API Endpoints
const API_BASE_URL = "http://localhost:4000";

async function testCustomAPI() {
  console.log("🧪 Testing Custom API Endpoints...\n");

  // Test 1: Enhanced Profile
  console.log("1️⃣ Testing Enhanced Profile...");
  try {
    const response = await fetch(`${API_BASE_URL}/custom/enhanced-profile`, {
      body: JSON.stringify({
        handle: "testuser",
        includeCustomData: true
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    const data = await response.json();
    console.log("✅ Enhanced Profile Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Enhanced Profile Error:", error);
  }

  // Test 2: Set Custom Field
  console.log("\n2️⃣ Testing Set Custom Field...");
  try {
    const response = await fetch(`${API_BASE_URL}/custom/set-field`, {
      body: JSON.stringify({
        fieldName: "heyScore",
        fieldValue: 95,
        handle: "testuser"
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    const data = await response.json();
    console.log("✅ Set Field Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Set Field Error:", error);
  }

  // Test 3: Get Custom Fields
  console.log("\n3️⃣ Testing Get Custom Fields...");
  try {
    const response = await fetch(`${API_BASE_URL}/custom/fields/testuser`);
    const data = await response.json();
    console.log("✅ Get Fields Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Get Fields Error:", error);
  }

  // Test 4: Update Score
  console.log("\n4️⃣ Testing Update Score...");
  try {
    const response = await fetch(`${API_BASE_URL}/custom/update-score`, {
      body: JSON.stringify({
        handle: "testuser",
        score: 100
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    const data = await response.json();
    console.log("✅ Update Score Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Update Score Error:", error);
  }

  console.log("\n🎉 All tests completed!");
}

// Chạy tests nếu file được execute trực tiếp
if (typeof window === "undefined") {
  testCustomAPI();
}

export default testCustomAPI;
