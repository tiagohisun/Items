
from googleapiclient.errors import HttpError
from googleapiclient.discovery import build
from google.oauth2 import service_account
import pytesseract
import PyPDF4
import re
import os

# Update the path to the JSON key file

KEY_FILE = 'H:\\My Drive\\Automation\\Google\\Google Sheet-PDF\\utopian-datum-382014-b283af65a084.json'


# Update the Google Sheet ID and range

SHEET_ID = '12JjqCBD7mek_MSN-ddhzNCS5o8K6vLyf6VVw8c0tQ2w'
RANGE = 'Sheet1!A:D'


# Folder containing PDF files

PDF_FOLDER = r'C:\\Users\\DENTAL04\\Documents\\NF 2023'


# Regular expressions to match specific data in the PDF file

HOURREGEX = r'(\d{2}:\d{2}:\d{2})'
TOMADORREGEX = r'TOMADOR\s:\s(.)\n'
DISCRIMINACAOREGEX = r'DISCRIMINAÇÃO DOS SERVIÇOS\s:(.)\n'
VALORREGEX = r'VALOR TOTAL DA NOTA.\n([^\n]R\$\s*\d+(?:[.,]\d{2})?)'


# Authenticate with Google Sheets API

creds = service_account.Credentials.from_service_account_file(KEY_FILE)
sheetsapi = build('sheets', 'v4', credentials=creds)


# Retrieve data from PDF files

data = []
pdffiles = [f for f in os.listdir(PDF_FOLDER) if f.endswith('.pdf')]
totalfiles = len(pdffiles)


for index, filename in enumerate(pdffiles):
    print(f'Processing file {index + 1}/{totalfiles}: {filename}')
    with open(os.path.join(PDF_FOLDER, filename), 'rb') as f:
        pdfreader = PyPDF4.PdfFileReader(f)
        hour = ''
        tomador = ''
        discriminacao = ''
        valor = ''
        for pagenum in range(len(pdfreader.pages)):
            page = pdfreader.pages[pagenum]
            text = page.extractText()
            if 'NOTA FISCAL DE ELETRÔNICA DE SERVIÇOS' in text:
                # Extract data from the PDF page using OCR
                image = page.toimage()
                hour, tomador, discriminacao, valor = '', '', '', ''
                for box in image.detecttext('por'):
                    if 'NOTA FISCAL DE ELETRÔNICA DE SERVIÇOS' in box.text:
                        hourmatch = re.search(HOURREGEX, box.text)
                        if hourmatch:
                            hour = hourmatch.group(1)
                    elif 'TOMADOR' in box.text:
                        tomadormatch = re.search(TOMADORREGEX, box.text)
                        if tomadormatch:
                            tomador = tomadormatch.group(1)
                    elif 'DISCRIMINAÇÃO DOS SERVIÇOS' in box.text:
                        discriminacaomatch = re.search(
                            DISCRIMINACAOREGEX, box.text)
                        if discriminacaomatch:
                            discriminacao = discriminacaomatch.group(1)
                    elif 'VALOR TOTAL DA NOTA' in box.text:
                        valormatch = re.search(VALORREGEX, box.text)
                        if valormatch:
                            valor = valormatch.group(1)

    if hour == '':
        hour = 'N/A'
    if tomador == '':
        tomador = 'N/A'
    if discriminacao == '':
        discriminacao = 'N/A'
    if valor == '':
        valor = 'N/A'

    data.append([hour, tomador, discriminacao, valor])
    print(f'Data found: {data[-1]}')
else:
    print(f'No data found in page {pagenum + 1} of file {filename}')


if not data:
    print('No data found in the PDF file:', filename)

# Insert the data into Google Sheets

if data:
    values = []
    for row in data:
        rowdata = []
        rowdata.append(row[0])
        rowdata.append(row[1])
        rowdata.append(row[2])
        rowdata.append(row[3].split('R$')[-1].strip())
        values.append(rowdata)

    request_body = {
        'majorDimension': 'ROWS',
        'values': values
    }

    try:
        response = sheetsapi.spreadsheets().values().append(
            spreadsheetId=SHEET_ID,
            range=RANGE,
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=request_body
        ).execute()
    except HttpError as error:
        print(f"An error occurred: {error}")
        print(f"Error details: {error.content}")
        response = None

    if response:
        print('Inserted data:', data)
    else:
        print('Data could not be inserted into Google Sheets.')

else:
    print('No data found in any of the PDF files.')
