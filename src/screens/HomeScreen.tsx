import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import MapViewComponent from '../components/MapViewComponent'

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <MapViewComponent />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    }
})

export default HomeScreen