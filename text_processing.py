import numpy as np
import pandas as pd
import pickle
from modern_dfs import ModernPhilosophers, ModernDocuments
from spacy.en import English
from sklearn.feature_extraction.stop_words import ENGLISH_STOP_WORDS
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.corpus import stopwords
from spacy.en import English
from string import punctuation
import multiprocessing
import re
import pdb


'''
This file processes the text data and
puts it into a quantitative form which will be used
to perform topic modeling
'''


# Global variables
STOPLIST = set(stopwords.words('english') + ["n't", "'s", "'m", "'", "'re", "'ve"] \
           + ['philosophy', 'philosophers'] + list(ENGLISH_STOP_WORDS))


def clean_document(doc):
    '''
    INPUT:
        text - a single philosophical text
    OUTPUT:
        text that has been cleaned based of unnecessary
        parts of speech, punctuation, and extra spaces

    Cleans a single document's text
    '''
    # Part's of speech to keep in the result
    pos_lst = ['ADJ', 'ADV', 'NOUN', 'PROPN', 'VERB']
    tokens = [token.lemma_.lower().replace(' ', '_') for token in doc if token.pos_ in pos_lst]

    spaces_lst = ['', ' ', '\n', '\n\n', '\r'] + ' '.join(punctuation).split()
    tokens = [token for token in doc if token not in spaces_lst]

    tokens = [token for token in tokens if token not in STOPLIST]

    return ' '.join(str(token) for token in tokens)


def cleanse_corpus(documents):
    '''
    INPUT:
        documents - an array-like object of text documents
    OUTPUT:
        cleaned_texts - an array of documents cleaned of
        unnecessary words and characters
    '''
    tokenized_docs = []

    clean_texts = np.array([], dtype='object')
    num_cores = multiprocessing.cpu_count()
    batch_size = min(int(len(documents) / (num_cores * 2)), 20)
    if batch_size == 0:
        batch_size=1

    batch_num = 0
    for doc in parser.pipe(documents, batch_size=batch_size, n_threads=num_cores - 1):
        print("Cleaning text for batch {}".format(batch_num))
        clean_texts = np.append(clean_document(doc), clean_texts)
        batch_num += 1

    return clean_texts, tokenized_docs


def term_frequency(documents):
    '''
    INPUT:
        documents - an array-like object of text documents
    OUTPUT:
        normalized_tf - term frequency matrix for the corpus
                        normalized with the l2 norm

    Transforms an array of documents into a normalized
    term frequency matrix
    '''

    vectorizer = TfidfVectorizer(max_df=0.95, min_df=2, \
                                norm='l2', use_idf=False)

    normalized_tf = vectorizer.fit_transform(documents)

    return normalized_tf, vectorizer


def load_data():
    '''
    INPUT:
        None
    OUTPUT:
        phils - Dataframe of philosopher data
        docs - Dataframe of document data
        full_texts - Complete text of each document in docs
        titles - Titles of each document in doc

    Load in the philosopher and document data
    and return useful information for topic modeling
    '''
    phils = ModernPhilosophers()
    docs = ModernDocuments()

    full_texts = docs.df['text'].values
    titles = docs.df['title'].values

    return phils, docs, full_texts, titles


if __name__ == '__main__':
    phils, docs, full_texts, titles = load_data()
    parser = English()

    full_texts = [x for x in full_texts[:3]]

    clean_texts, tokenized_docs = cleanse_corpus(full_texts)

    normalized_tf, vectorizer = term_frequency(clean_texts)

    with open('data/model/vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    with open('data/model/tf_matrix.pkl', 'wb') as f:
        pickle.dump(normalized_tf, f)
    with open('data/model/tokens.pkl', 'wb') as f:
        pickle.dump(tokenized_docs, f)