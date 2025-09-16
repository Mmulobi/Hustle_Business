// Check which lucide-react-native icons are undefined
const fs = require('fs');

try {
  // Read the lucide-react-native package to see what's exported
  const packagePath = './node_modules/lucide-react-native/lib/lucide-react-native.js';
  
  if (fs.existsSync(packagePath)) {
    const content = fs.readFileSync(packagePath, 'utf8');
    
    // Icons we're trying to import
    const iconsToCheck = [
      'Home', 'BarChart3', 'Package', 'Users', 'User', 'LogOut', 'Menu', 'X',
      'TrendingUp', 'TrendingDown', 'DollarSign', 'Plus', 'RefreshCw', 'Sparkles',
      'Leaf', 'Zap', 'CreditCard', 'AlertTriangle', 'ArrowUp', 'Calendar',
      'Eye', 'Activity', 'Clock', 'Target', 'MapPin', 'Truck', 'ShoppingCart',
      'Wifi', 'WifiOff', 'MessageCircle'
    ];
    
    const undefinedIcons = [];
    
    iconsToCheck.forEach(icon => {
      // Check if the icon is exported in the package
      const exportPattern = new RegExp(`exports\\.${icon}\\s*=|export\\s*{[^}]*${icon}[^}]*}`);
      if (!exportPattern.test(content)) {
        undefinedIcons.push(icon);
      }
    });
    
    if (undefinedIcons.length > 0) {
      console.log('Potentially undefined icons:', undefinedIcons.join(', '));
    } else {
      console.log('All icons appear to be defined');
    }
  } else {
    console.log('Package file not found, checking index.js');
    
    // Try alternative path
    const indexPath = './node_modules/lucide-react-native/lib/index.js';
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      console.log('Found index.js, checking exports...');
      
      // Look for specific problematic icons
      const problematicIcons = ['BarChart3', 'Sparkles', 'Eye', 'Activity', 'Target', 'MapPin', 'Truck', 'ShoppingCart'];
      const missing = [];
      
      problematicIcons.forEach(icon => {
        if (!content.includes(icon)) {
          missing.push(icon);
        }
      });
      
      if (missing.length > 0) {
        console.log('Missing icons:', missing.join(', '));
      }
    }
  }
} catch (error) {
  console.log('Error:', error.message);
}
