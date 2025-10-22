const { getPublicTopPlayers, getPublicTopUniversities } = require('../services/NCPAService.ts');

async function testNCPAService() {
  console.log('Testing NCPA Service...\n');

  try {
    // Test getting top players
    console.log('1. Testing getPublicTopPlayers...');
    const playersResponse = await getPublicTopPlayers();
    
    if (playersResponse.success) {
      console.log('✅ Successfully fetched players data');
      console.log(`   - Total players: ${playersResponse.data?.length || 0}`);
      if (playersResponse.data && playersResponse.data.length > 0) {
        const firstPlayer = playersResponse.data[0];
        console.log(`   - Sample player: ${firstPlayer.first_name} ${firstPlayer.last_name} (${firstPlayer.college || 'No College'})`);
        console.log(`   - Rating: ${firstPlayer.doubles_rating}`);
      }
    } else {
      console.log('❌ Failed to fetch players data');
      console.log(`   - Error: ${playersResponse.error}`);
    }

    console.log('\n2. Testing getPublicTopUniversities...');
    const universitiesResponse = await getPublicTopUniversities();
    
    if (universitiesResponse.success) {
      console.log('✅ Successfully fetched universities data');
      console.log(`   - Total universities: ${universitiesResponse.data?.length || 0}`);
      if (universitiesResponse.data && universitiesResponse.data.length > 0) {
        const firstUniversity = universitiesResponse.data[0];
        console.log(`   - Sample university: ${firstUniversity.name}`);
      }
    } else {
      console.log('❌ Failed to fetch universities data');
      console.log(`   - Error: ${universitiesResponse.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testNCPAService();
