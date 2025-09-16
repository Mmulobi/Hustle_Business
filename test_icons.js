// Comprehensive test to check which lucide-react-native icons are undefined
console.log('Testing lucide-react-native icons...');

try {
  const lucide = require('lucide-react-native');
  
  // All icons being imported in DashboardScreen
  const iconsToTest = [
    'Home', 'BarChart', 'Package', 'Users', 'User', 'LogOut', 'Menu', 'X',
    'TrendingUp', 'TrendingDown', 'DollarSign', 'Plus', 'RefreshCw', 'Star',
    'Leaf', 'Zap', 'CreditCard', 'AlertTriangle', 'ArrowUp', 'Calendar',
    'Search', 'Clock', 'Target', 'MapPin', 'Truck', 'ShoppingCart',
    'Wifi', 'WifiOff', 'MessageCircle'
  ];
  
  const undefinedIcons = [];
  const definedIcons = [];
  
  iconsToTest.forEach(iconName => {
    if (lucide[iconName] === undefined) {
      undefinedIcons.push(iconName);
    } else {
      definedIcons.push(iconName);
    }
  });
  
  console.log('=== ICON TEST RESULTS ===');
  console.log(`Total icons tested: ${iconsToTest.length}`);
  console.log(`Defined icons: ${definedIcons.length}`);
  console.log(`Undefined icons: ${undefinedIcons.length}`);
  
  if (undefinedIcons.length > 0) {
    console.log('\n❌ UNDEFINED ICONS (causing the error):');
    undefinedIcons.forEach(icon => console.log(`  - ${icon}`));
  }
  
  if (definedIcons.length > 0) {
    console.log('\n✅ DEFINED ICONS:');
    definedIcons.forEach(icon => console.log(`  - ${icon}`));
  }
  
  // Check if there are any alternative names for undefined icons
  if (undefinedIcons.length > 0) {
    console.log('\n🔍 CHECKING FOR ALTERNATIVES:');
    const allExports = Object.keys(lucide);
    
    undefinedIcons.forEach(missing => {
      const alternatives = allExports.filter(exported => 
        exported.toLowerCase().includes(missing.toLowerCase()) ||
        missing.toLowerCase().includes(exported.toLowerCase())
      );
      
      if (alternatives.length > 0) {
        console.log(`  ${missing} -> Possible alternatives: ${alternatives.join(', ')}`);
      } else {
        console.log(`  ${missing} -> No similar alternatives found`);
      }
    });
  }
  
} catch (error) {
  console.log('❌ Error testing icons:', error.message);
  console.log('This might indicate a problem with the lucide-react-native package');
}
