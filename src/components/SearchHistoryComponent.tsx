import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
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
}

const HISTORY_STORAGE_KEY = '@search_history';


const SearchHistoryComponent =
    React.forwardRef<{ loadSearchHistory: () => void }, SearchHistoryComponentProps>((
        { onHistoryItemSelect, },
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

        const handleHistoryItemPress = useCallback((item: SearchHistoryItem) => {
            onHistoryItemSelect(item);
            bottomSheetRef.current?.snapToIndex(0);
            // bottomSheetRef.current?.close();
        }, [onHistoryItemSelect]);

        const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
            <TouchableOpacity
                style={styles.historyItem}
                onPress={() => handleHistoryItemPress(item)}
            >
                <Text style={styles.historyItemTitle}>{item.name}</Text>
                <Text style={styles.historyItemAddress}>{item.address}</Text>
                <Text style={styles.historyItemTime}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </TouchableOpacity>
        );



        const handleSheetChanges = useCallback((index: number) => {
            console.log('handleSheetChanges', index);
        }, []);

        if (searchHistory.length === 0) {
            return <View />
        }
        console.log('searchHistory', searchHistory.length);

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                onChange={handleSheetChanges}
            >
                <BottomSheetView style={styles.contentContainer}>
                    <View style={styles.contentContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Search History</Text>
                            <TouchableOpacity onPress={clearHistory}>
                                <Text style={styles.clearButton}>Clear All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={searchHistory}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item.timestamp.toString()}
                            style={styles.list}
                        />
                    </View>
                </BottomSheetView>
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
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    historyItem: {
        paddingHorizontal: 26,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    historyItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    historyItemAddress: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    historyItemTime: {
        fontSize: 10,
        color: '#999',
    },
});

export default SearchHistoryComponent;