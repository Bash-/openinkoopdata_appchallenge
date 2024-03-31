import requests
import json
import os
import datetime

def extract_data(api_url):
    response = requests.get(api_url)
    end_of_new_records = False
    if response.status_code == 200:
        publications = []
        today = datetime.date.today()
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
        directory = os.path.join('data_local', "raw", str(today))
        os.makedirs(directory, exist_ok=True)
        
        # Write the extracted data to a JSON file
        with open(os.path.join(directory, f'publications.json'), 'w') as f:
            for item in publications:
                f.write(json.dumps(item) + "\n")

        print("Data extraction complete")
    else:
        print("Failed to retrieve data from the API")

# API endpoint URL
api_url = "https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties?size=100"

# Call the function to extract data
extract_data(api_url)