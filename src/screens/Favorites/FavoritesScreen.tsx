import { View, Text } from 'react-native'
import React from 'react'
import { API_KEY } from '@env'

const FavoritesScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>FavoritesScreen {API_KEY}</Text>
    </View>
  )
}

export default FavoritesScreen