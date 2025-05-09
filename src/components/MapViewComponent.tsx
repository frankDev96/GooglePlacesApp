import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Platform,
    PermissionsAndroid,
    Alert,
    Keyboard,
} from 'react-native';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_MAPS_CONFIG, MAP_DEFAULTS } from '../config/maps';
import PlacesSearchComponent from './PlacesSearchComponent';
import SearchHistoryComponent from './SearchHistoryComponent';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const HISTORY_STORAGE_KEY = '@search_history';

const MapViewComponent = () => {
    const [loading, setLoading] = useState(true);
    const [region, setRegion] = useState(MAP_DEFAULTS.INITIAL_REGION);
    const [coordinate, setCoordinate] = useState(MAP_DEFAULTS.INITIAL_REGION);
    const [placeName, setPlaceName] = useState('');
    const [placeAddress, setPlaceAddress] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const historyComponentRef = useRef<{ loadSearchHistory: () => void } | null>(null)
    const mapRef = useRef<MapView>(null);


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
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
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
                setCoordinate({
                    latitude,
                    longitude,
                });
            },
            error => {
                console.log(error);
                Alert.alert('Error', 'Failed to get current location');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const saveToHistory = async (searchItem: any) => {
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

            history = [newItem, ...history].slice(0, 10);
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

            setTimeout(() => {
                Keyboard.dismiss()
                historyComponentRef.current?.loadSearchHistory()
            }, 100);
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    };

    const handlePlaceSelect = (details: any) => {
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

    const handleHistoryItemSelect = (item: any) => {
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
    };

    const animateToRegion = (newRegion: any) => {
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
            >
                <Marker coordinate={coordinate} pinColor="#2196F3">
                    <Callout tooltip style={styles.callout}>
                        <View style={styles.calloutContainer}>
                            <Text style={styles.calloutTitle}>{placeName}</Text>
                            <Text style={styles.calloutAddress}>{placeAddress}</Text>
                        </View>
                    </Callout>
                </Marker>
            </MapView>

            <SearchHistoryComponent
                ref={historyComponentRef}
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
        top: 20,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    map: {
        flex: 1,
    },
    calloutContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        maxWidth: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    calloutAddress: {
        fontSize: 14,
        color: '#666',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
    },
});

export default MapViewComponent;
