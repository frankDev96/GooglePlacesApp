import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetFlatList, } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchHistoryItem {
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    timestamp: number;
}

interface SearchHistoryComponentProps {
    onHistoryItemSelect: (item: SearchHistoryItem) => void;
    coordinate: {
        latitude: number;
        longitude: number;
    }
}

const HISTORY_STORAGE_KEY = '@search_history';


const SearchHistoryComponent =
    React.forwardRef<{ loadSearchHistory: () => void }, SearchHistoryComponentProps>((
        { onHistoryItemSelect, coordinate },
        ref
    ) => {
        const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
        const bottomSheetRef = React.useRef<BottomSheet>(null);
        const snapPoints = React.useMemo(() => ['25%', '50%'], []);

        React.useImperativeHandle(ref, () => ({
            loadSearchHistory
        }));

        useEffect(() => {
            loadSearchHistory();
        }, []);

        const loadSearchHistory = async () => {
            try {
                const historyString = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
                if (historyString) {
                    const history = JSON.parse(historyString);
                    setSearchHistory(history);
                }
            } catch (error) {
                console.error('Error loading search history:', error);
            }
        };

        const clearHistory = async () => {
            try {
                await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
                setSearchHistory([]);
                bottomSheetRef.current?.close();
            } catch (error) {
                console.error('Error clearing search history:', error);
            }
        };
        const clearHistoryAlert = async () => {
            Alert.alert(
                'Clear History',
                'Are you sure you want to clear your search history?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Clear',
                        onPress: clearHistory,
                        style: 'destructive',

                    },
                ]
            )
        }

        const handleHistoryItemPress = useCallback((item: SearchHistoryItem) => {
            onHistoryItemSelect(item);
            bottomSheetRef.current?.snapToIndex(0);
        }, [onHistoryItemSelect]);

        const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
            <TouchableOpacity
                style={styles.historyItem}
                onPress={() => handleHistoryItemPress(item)}
            >
                <Text style={styles.historyItemTitle(coordinate?.latitude == item?.coordinates?.latitude)}>{item.name}</Text>
                <Text style={styles.historyItemAddress(coordinate?.latitude == item?.coordinates?.latitude)}>{item.address}</Text>
                <Text style={styles.historyItemTime(coordinate?.latitude == item?.coordinates?.latitude)}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </TouchableOpacity>
        );

        if (searchHistory.length === 0) {
            return <View />
        }

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enableDynamicSizing={true}
            >
                <View style={styles.contentContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Previous searches</Text>
                        <TouchableOpacity onPress={clearHistoryAlert}>
                            <Text style={styles.clearButton}>Clear All</Text>
                        </TouchableOpacity>
                    </View>
                    <BottomSheetFlatList
                        data={searchHistory}
                        renderItem={renderHistoryItem}
                        keyExtractor={(item) => item.timestamp.toString()}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            </BottomSheet>
        );
    })

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'grey',
    },
    contentContainer: {
        flex: 1,
    },
    bottomSheetBackground: {
        backgroundColor: 'white',
    },
    bottomSheetIndicator: {
        backgroundColor: '#A0A0A0',
        width: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    clearButton: {
        color: '#ff6b6b',
        fontSize: 14,
    },
    list: {
        maxHeight: Dimensions.get('window').height * 0.7,
    },
    listContent: {
        marginBottom: 30,
    },
    historyItem: {
        paddingHorizontal: 26,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    historyItemTitle: (selected: boolean) => ({
        fontSize: 14,
        fontWeight: '600',
        color: selected ? '#ff6b6b' : '#333',
        marginBottom: 4,
    }),
    historyItemAddress: (selected: boolean) => ({
        fontSize: 12,
        color: selected ? '#ff6b6b' : '#333',
        marginBottom: 4,
    }),
    historyItemTime: (selected: boolean) => ({
        fontSize: 10,
        color: selected ? '#ff6b6b' : '#333',
    }),
});

export default memo(SearchHistoryComponent);