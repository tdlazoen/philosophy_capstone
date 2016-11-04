import numpy as np
import pandas as pd
import re
import us
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from modern_dfs import ModernPhilosophers, ModernDocuments

def determine_nationality(df):
	'''
	INPUT:
		df - dataframe containing philosopher data
	OUTPUT:
		df - dataframe with null nationalities filled in
			 (if the same row has a non-null birthplace)

	Determines the nationality of philosophers with null nationalities but non-null birthplaces based on their birthplace
	'''
	with open('data/nationalities.json', 'r') as f:
		nationality_dict = json.load(f)
	df_temp = df.fillna('')

	for i in range(df_temp.shape[0]):
		if not df_temp.loc[i, 'nationality'] or df_temp.loc[i, 'birthplace']:
			birthplace = re.split(r'\,', df.loc[i, 'birthplace'])[-1].strip()

			for country in nationality_dict.keys():
				if birthplace == country:
					df.loc[i, 'nationality'] = nationality_dict[country]
	return df

def remove_copyright(author, text):
	'''
	INPUT:
		author - author of document's name
		text - full text of document
	OUTPUT:
		text with copyright section removed

	Removes copyright sections from documents if they exist
	'''
	start = text.find('copyright')
	end = text[start:].find(author.split()[-1]) + start

	# Check if the start and end worked.  If not, just scrape entire text
	if not (start == -1 or end == -1):
		text = text[:start] + text[end-1:]
		name_first = text.find(author)
		idx = name_first + len(author)
		text = text[:idx] + text[idx:].replace(author, '')

	return text

def drop_entries(phils, docs):
	'''
	INPUT:
		phils - philosopher dataframe
		docs - documents dataframe
	OUTPUT:
		None

	Drops documents and philosophers with insufficient information
	'''

	drop_phils = []
	phils.df.fillna('', inplace=True)
	for i in range(phils.df.shape[0]):
		nationality = phils.df.loc[i, 'nationality']
		birthplace = phils.df.loc[i, 'birthplace']
		name = phils.df.loc[i, 'name']

		if (not nationality) or (not birthplace):
			if docs.df[docs.df.author == name].shape[0] < 2:
				idx = docs.df[docs.df.author == name].index[0]
				if docs.df.loc[idx, 'words'] < 30000:
					drop_phils.append(i)

	phils.df.drop(drop_phils, inplace=True)

	drop_authors = [x for x in np.unique(docs.df['author']) if x not \
	 			 	in phils.df.name.values]

	drop_idxs = []
	for author in drop_authors:
		drop_idxs.append(docs.df[docs.df.author == author].index[0])

	docs.df.drop(drop_idxs, inplace=True)

	phils.save_df()
	docs.save_df()

def null_value_query(query):
	'''
	INPUT:
		query - query to search google for
	OUTPUT:
		Results of query

	Seach google and return results
	'''

	driver = webdriver.Chrome()
	driver.wait = WebDriverWait(driver, 5)
	driver.get('https://www.google.com')

	box = driver.wait.until (
			EC.presence_of_element_located((By.NAME, 'q'))
	)

	box.send_keys(query)
	box.submit()

	try:
		results = driver.wait.until(
				EC.presence_of_element_located((By.XPATH, '//*[@id="rso"]/div[1]/div[1]/div/div[1]/div[2]/div[2]/div/div[2]/div/div/div[1]'))
		)

		results = results.text.strip()
		print(results)
		cont = input('Okay? ')

		if cont == 'n':
			results = input('What should the result be? ')

	except TimeoutException:
		results = input('What should the result be? ')

	return results.strip().lower()

def fill_in_nulls(phils, docs):
	'''
	INPUT:
		phils - philosopher dataframe
		docs - documents dataframe
	OUTPUT:
		None

	Fill in null values using google search
	'''
	for i in range(docs.df.shape[0]):
		author = docs.df.loc[i, 'author']
		title = docs.df.loc[i, 'title']

		if docs.df.loc[i, 'year'] == 0:
			query = title + ' ' + author + ' year'
			date = null_value_query(query)
			year = int(date.split(', ')[-1].strip())

			idx = phils.df[phils.df.name == author].index[0]
			if year > phils.df.loc[idx, 'year_died']:
				year = input('Year after death!  What should it be? ')

			docs.df.loc[i, 'year'] = year
			docs.df.loc[i, 'century'] = year - (year % 100)

	phils.df.fillna('', inplace=True)
	for i in range(phils.df.shape[0]):
		name = phils.df.loc[i, 'name']
		nationality = phils.df.loc[i, 'nationality']
		birthplace = phils.df.loc[i, 'birthplace']

		if not nationality:
			query = 'nationality of ' + name
			phils.df.loc[i, 'nationality'] = null_value_query(query)
		if not birthplace:
			query = 'birthplace of ' + name
			birthplace = null_value_query(query)
			if phils.df.loc[i, 'nationality'] == 'american':
				birthplace = phils.american_birthplaces(birthplace)
			phils.df.loc[i, 'birthplace'] = birthplace
			phils.df.loc[i, 'country'] = birthplace.split(',')[-1].strip()

if __name__ == '__main__':
	# Load dataframes
	phils = ModernPhilosophers()
	docs = ModernDocuments()

	drop_entries(phils, docs)
	fill_in_nulls(phils, docs)

	# Pring out useful information
	print('# of Modern Authors with no documents: ', len([x for x in phils.df['name'] if x not in docs.df.author.values]))

	print('Modern Authors with no documents: ', [x for x in phils.df['name'] if x not in docs.df.author.values])

	print('Modern Authors with documents not in philosopher df: ', [x for x in np.unique(docs.df['author']) if x not in phils.df.name.values])

	print('Modern Authors with more than one document: ', len([x for x in np.unique(docs.df['author']) if docs.df[docs.df.author == x].shape[0] > 1]))

	print('Modern Authors with more than two documents: ', len([x for x in np.unique(docs.df['author']) if docs.df[docs.df.author == x].shape[0] > 2]))

	print('Documents with no year: ', docs.df[docs.df.year == 0].shape[0])

	print('Shape of Modern Philosopher dataframe: ', phils.df.shape)

	print('Shape of Modern Documents dataframe: ', docs.df.shape)

	print('Number of null nationalities: ', phils.df[phils.df.nationality.isnull()].shape[0])

	print('Number of null birthplaces: ', phils.df[phils.df.birthplace.isnull()].shape[0])

	print('Number of philosophers with birthplaces but no nationalities: ',
	phils.df[(phils.df.birthplace.notnull()) & (phils.df.nationality.isnull())].shape[0])
