import { Redirect } from 'expo-router';

export default function Index() {
  // For now, redirect to auth screen
  // Later we'll add authentication state checking
  return <Redirect href="/auth" />;
}
