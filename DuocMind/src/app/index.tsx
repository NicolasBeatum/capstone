import { StyleSheet, Text, View } from 'react-native';

export default function IndexRoute() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        DuocMind
      </Text>
      <Text style={styles.subtitle}>Proyecto vacío</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7fb',
    padding: 24,
  },
  title: {
    color: '#0b1f33',
    fontSize: 36,
    fontWeight: '700',
  },
  subtitle: {
    color: '#314b63',
    fontSize: 18,
    marginTop: 8,
  },
});
