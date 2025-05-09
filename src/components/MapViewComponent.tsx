import {
    View,

    StyleSheet,
    Platform,
    PermissionsAndroid,
    Alert,
    Keyboard,
} from 'react-native';
import React, { useState, useEffect, useRef, memo, } from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAP_DEFAULTS } from '../config/maps';
import PlacesSearchComponent from './PlacesSearchComponent';
import SearchHistoryComponent from './SearchHistoryComponent';
import CustomMarker from './CustomMarker';

const HISTORY_STORAGE_KEY = '@search_history';

const MapViewComponent = () => {
    const [region, setRegion] = useState<{
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    }>(MAP_DEFAULTS.INITIAL_REGION);
    const [coordinate, setCoordinate] = useState<{
        latitude: number;
        longitude: number;
    }>(MAP_DEFAULTS.INITIAL_REGION);
    const [placeName, setPlaceName] = useState('');
    const [placeAddress, setPlaceAddress] = useState('');
    const historyComponentRef = useRef<{ loadSearchHistory: () => void } | null>(null)
    const mapRef = useRef<MapView>(null);
    const markerRef = useRef(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (markerRef.current !== null && placeName !== '') {
                markerRef.current.showCallout();
            }
        }, 100); // Delay of 1 second

        return () => clearTimeout(timeout);
    }, [placeName]);




    const requestLocationPermission = async () => {
        try {
            if (Platform.OS === 'ios') {
                const auth = await Geolocation.requestAuthorization('whenInUse');
                if (auth === 'granted') {
                    getCurrentLocation();
                }
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'This app needs access to your location.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    getCurrentLocation();
                }
            }
        } catch (err) {
            console.warn(err);
            Alert.alert('Error', 'Failed to get location permission');
        }
    };

    const getCurrentLocation = (updateCoordinate = true) => {
        Geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const newRegion = {
                    latitude,
                    longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                };
                setRegion(newRegion);
                if (updateCoordinate) {
                    setCoordinate({
                        latitude,
                        longitude,
                    });
                }
            },
            error => {
                console.log(error);
                Alert.alert('Error', 'Failed to get current location');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    // Removed automatic location request on component mount

    const saveToHistory = async (searchItem: {
        name: string;
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
    }) => {
        try {
            const historyString = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
            let history = historyString ? JSON.parse(historyString) : [];

            const newItem = {
                name: searchItem.name,
                address: searchItem.formatted_address,
                coordinates: {
                    latitude: searchItem.geometry.location.lat,
                    longitude: searchItem.geometry.location.lng,
                },
                timestamp: Date.now(),
            };
            const findIndex = history.findIndex(item => searchItem?.name == item?.name)

            if (findIndex !== -1) {
                history.splice(findIndex, 1);
            }
            history = [newItem, ...history]

            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

            setTimeout(() => {
                Keyboard.dismiss()
                historyComponentRef.current?.loadSearchHistory()
            }, 100);
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    };

    const handlePlaceSelect = (details: {
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        name?: string;
        formatted_address?: string;
    }) => {
        if (details?.geometry?.location) {
            const { lat, lng } = details.geometry.location;
            const newRegion = {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };
            setRegion(newRegion);
            setCoordinate({
                latitude: lat,
                longitude: lng,
            });
            setPlaceName(details.name || '');
            setPlaceAddress(details.formatted_address || '');
            saveToHistory(details);
        }
    };

    const handleHistoryItemSelect = (item: {
        coordinates: {
            latitude: number;
            longitude: number;
        };
        name: string;
        address: string;
    }) => {
        const newRegion = {
            latitude: item.coordinates.latitude,
            longitude: item.coordinates.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
        setCoordinate({
            latitude: item.coordinates.latitude,
            longitude: item.coordinates.longitude,
        });
        setPlaceName(item.name);
        setPlaceAddress(item.address);
        const newItem = {
            name: item.name,
            formatted_address: item.address,
            geometry: {
                location: {
                    lat: item.coordinates.latitude,
                    lng: item.coordinates.longitude,
                },
            },
        }
        saveToHistory(newItem);
    };

    const animateToRegion = (newRegion: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    }) => {
        mapRef.current?.animateToRegion(newRegion, 1000);
    };

    useEffect(() => {
        if (region !== MAP_DEFAULTS.INITIAL_REGION) {
            animateToRegion(region);
        }
    }, [region]);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <PlacesSearchComponent onPlaceSelect={handlePlaceSelect} />
            </View>

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={region}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                showsIndoors={false}
                zoomControlEnabled={false}
                toolbarEnabled={false}
                loadingEnabled={true}
                loadingIndicatorColor="blue"
                loadingBackgroundColor="rgba(255, 255, 255, 0.7)"
            >
                <CustomMarker coordinate={coordinate} />
            </MapView>

            <SearchHistoryComponent
                ref={historyComponentRef}
                coordinate={coordinate}
                onHistoryItemSelect={handleHistoryItemSelect}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'lightgrey',
        height: '100%',
        width: '100%',
    },
    searchContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 1,
    },
    map: {
        flex: 1,
    },
    calloutContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    callout: {
        position: 'absolute',
        flex: -1,
        padding: 0,
        backgroundColor: 'transparent',
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    calloutAddress: {
        fontSize: 11,
        color: '#666',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
    },
    marker: {

    }
});

export default memo(MapViewComponent);
