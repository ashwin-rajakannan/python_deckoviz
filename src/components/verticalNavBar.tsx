import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
const VerticalNav = () => {
  const [activeCategory, setActiveCategory] = useState('All Collection');

  const categories = [
    'All Collection',
    'Minimalist',
    'Abstract',
    'Modern Collection',
    'Classical Historical',
  ];
const navigation = useNavigation();
  return (
    <View style={styles.navContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.navItem,
              activeCategory === category && styles.activeNavItem,
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.navText,
                activeCategory === category && styles.activeNavText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    width: 160,
    backgroundColor: '#f8f8f8',
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  activeNavItem: {
    backgroundColor: '#000',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4757',
  },
  navText: {
    fontSize: 14,
    color: '#333',
  },
  activeNavText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default VerticalNav;