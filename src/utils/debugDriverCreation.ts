/**
 * Debug utility for driver creation
 * Use this to test driver creation with different data formats
 */

export const testDriverCreation = async (driverData: any) => {
  console.log('=== Testing Driver Creation ===');
  console.log('Data being sent:', driverData);
  
  try {
    const response = await fetch('http://localhost:1340/api/drivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify(driverData)
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
    } else {
      console.log('Success! Driver created');
    }
    
    return { status: response.status, body: responseText };
  } catch (error) {
    console.error('Network Error:', error);
    return { error };
  }
};

export const testDriverCreationWithStrapiFormat = async (driverData: any) => {
  // Strapi often expects data wrapped in a 'data' object
  const strapiData = {
    data: driverData
  };
  
  console.log('=== Testing Driver Creation with Strapi Format ===');
  return testDriverCreation(strapiData);
};

export const testDriverCreationWithValidation = async () => {
  const testData = {
    fullName: 'Test Driver',
    countryDialCode: '+91',
    contactNumber: '9876543210',
    emgCountryDialCode: '+91',
    emgContactNumber: '9876543210',
    aadhaarNumber: '123456789012',
    address: 'Test Address, Test City, Test State',
    panNumber: 'ABCDE1234F',
    reference: 'Test Reference'
  };
  
  console.log('=== Testing with Valid Data ===');
  return testDriverCreation(testData);
};

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testDriverCreation = testDriverCreation;
  (window as any).testDriverCreationWithStrapiFormat = testDriverCreationWithStrapiFormat;
  (window as any).testDriverCreationWithValidation = testDriverCreationWithValidation;
}
