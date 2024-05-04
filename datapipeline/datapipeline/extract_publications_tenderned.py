import requests
import json
import os
import datetime
from utils.gcp_helpers import upload_file_to_gcp

def extract_data(api_url):
    response = requests.get(api_url)
    end_of_new_records = False
    if response.status_code == 200:
        publications = []
        today = datetime.date.today() - datetime.timedelta(days=1)
        data = response.json()
        total_pages = data['totalPages']
        # total_pages
        for page in range(0, total_pages):
            url = f"{api_url}&page={page}"
            print(url)
            response = requests.get(url)
            if response.status_code == 200 and end_of_new_records == False:
                data = response.json()
                for item in data['content']:
                    if (item['publicatieDatum'] == str(today)):
                        publications.append(item)
                        print(item['publicatieDatum'])
                    elif (item['publicatieDatum'] < str(today)):
                        # break all for loops if the publication date is not today
                        end_of_new_records = True
                        break
            elif response.status_code == 200 and end_of_new_records == True:
                print("End of new records")
                break
            else:
                print(response.status_code)
                print(url)
                print(f"Failed to extract data from page {page}")
                break

        # Create directory based on today's date
        directory = os.path.join("raw", "publications", str(today))
        local_directory = os.path.join('data_local', directory)
        os.makedirs(local_directory, exist_ok=True)
        local_filename = os.path.join(local_directory, 'publications.json')
        
        # Write the extracted data to a JSON file
        with open(local_filename, 'w') as f:
            for item in publications:
                f.write(json.dumps(item) + "\n")
        
        upload_file_to_gcp(local_filename, 'aitenderportaal-storage', os.path.join(directory, 'publications.json'))

        print("Data extraction complete")
    else:
        print("Failed to retrieve data from the API")
        
# API endpoint URL
api_url = "https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties?size=100"

# Call the function to extract data
extract_data(api_url)