import React, { useState, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import debounce from 'lodash/debounce';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

interface Place {
    description: string;
    place_id: string;
}

interface PlacesSearchComponentProps {
    onPlaceSelect: (details: any) => void;
}

const PlacesSearchComponent: React.FC<PlacesSearchComponentProps> = ({ onPlaceSelect }) => {
    const [searchText, setSearchText] = useState('');
    const [predictions, setPredictions] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPlacePredictions = async (input: string) => {
        try {
            setLoading(true);
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    input
                )}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&components=country:us`
            );
            const data = await response.json();
            setPredictions(data.predictions || []);
        } catch (error) {
            console.error('Error fetching predictions:', error);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchPredictions = useCallback(
        debounce((text: string) => {
            if (text.length >= 2) {
                fetchPlacePredictions(text);
            } else {
                setPredictions([]);
            }
        }, 300),
        []
    );

    const handleInputChange = (text: string) => {
        setSearchText(text);
        debouncedFetchPredictions(text);
    };

    const fetchPlaceDetails = async (placeId: string) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_CONFIG.API_KEY}`
            );
            const data = await response.json();
            if (data.result) {
                onPlaceSelect(data.result);
                setSearchText('');
                setPredictions([]);
            }
        } catch (error) {
            console.error('Error fetching place details:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Search for a place..."
                    value={searchText}
                    onChangeText={handleInputChange}
                    placeholderTextColor="#666"
                />
                {loading && <ActivityIndicator style={styles.loader} color="#000" />}
            </View>
            {predictions.length > 0 && (
                <FlatList
                    data={predictions}
                    keyExtractor={(item) => item.place_id}
                    style={styles.predictionsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.predictionItem}
                            onPress={() => fetchPlaceDetails(item.place_id)}
                        >
                            <Text style={styles.predictionText}>{item.description}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
    },
    loader: {
        marginRight: 10,
    },
    predictionsList: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginTop: 8,
        maxHeight: 200,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    predictionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    predictionText: {
        fontSize: 14,
        color: '#333',
    },
});

export default PlacesSearchComponent;