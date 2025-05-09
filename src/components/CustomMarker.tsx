import { Marker } from 'react-native-maps';
import { Image, StyleSheet } from 'react-native';
import { memo } from 'react';

const CustomMarker = ({ coordinate, placeName, placeAddress }: any) => (
    <Marker coordinate={coordinate} style={{ height: 200, width: 200 }}>
        <Image
            source={require('../assets/images/locationPin.png')}
            style={{ width: 25, height: 25, tintColor: 'red', resizeMode: 'contain' }}
        />
    </Marker>
);
const styles = StyleSheet.create({
    markerContent: {
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        minWidth: 120,
    },
    placeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    placeAddress: {
        fontSize: 12,
        color: '#666',
    },
});

export default memo(CustomMarker);