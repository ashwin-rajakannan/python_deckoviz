import React, { createContext, useContext, useState } from 'react';

const CollectionQueueContext = createContext();

export const CollectionQueueProvider = ({ children }) => {
  const [collectionQueue, setCollectionQueue] = useState([]);
  const [currentCollection, setCurrentCollection] = useState(null);

  // Collection Queue methods
  const updateCollectionQueue = (newQueue) => {
    setCollectionQueue(newQueue);
  };

  const addToQueue = (collection) => {
    setCollectionQueue((prev) => [...prev, collection]);
  };

  const removeFromQueue = (collectionId) => {
    setCollectionQueue((prev) => prev.filter(c => c.id !== collectionId));
  };

  const clearQueue = () => {
    setCollectionQueue([]);
  };

  // Current Collection methods
  const updateCurrentCollection = (collection) => {
    setCurrentCollection(collection);
  };

  const clearCurrentCollection = () => {
    setCurrentCollection(null);
  };

  // Combined operations
  const setNextCollectionFromQueue = () => {
    if (collectionQueue.length > 0) {
      const [nextCollection, ...remainingQueue] = collectionQueue;
      setCurrentCollection(nextCollection);
      setCollectionQueue(remainingQueue);
      return nextCollection;
    }
    return null;
  };

  return (
    <CollectionQueueContext.Provider
      value={{
        // Queue state and methods
        collectionQueue,
        setCollectionQueue: updateCollectionQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        
        // Current collection state and methods
        currentCollection,
        setCurrentCollection: updateCurrentCollection,
        clearCurrentCollection,
        
        // Combined methods
        setNextCollectionFromQueue
      }}
    >
      {children}
    </CollectionQueueContext.Provider>
  );
};

export const useCollectionQueue = () => {
  const context = useContext(CollectionQueueContext);
  if (!context) {
    throw new Error('useCollectionQueue must be used within a CollectionQueueProvider');
  }
  return context;
};