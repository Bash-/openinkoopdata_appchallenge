import datetime
import json
import os
import re
from dataclasses import dataclass
from typing import List

import requests
from bs4 import BeautifulSoup


@dataclass
class PianooLink:
    url: str
    title: str
    description: str
    content: str

    def __eq__(self, other):
        return self.url == other.url


PAGE_LIMIT = 1000
PIANOO_SITEMAP_URL = "https://www.pianoo.nl/nl/sitemap"
PIANOO_SAVE_PATH = "./pianoo"


def is_ignored(link: str) -> bool:
    """Determine if a link should be ignored based on predefined patterns.

    Args:
        link (str): href link from pianoo

    Returns:
        bool: True if the link should be ignored, False otherwise
    """
    IGNORED_LINKS = [
        r"^#$",  # Fragment only links
        r"^/nl/formulier/.*$",  # Forms
        r"^/nl/nieuwsbrieven/.*$",  # Newsletters
        r"^/nl/archive/.*$",  # Archive
        r"^/nl/actueel/.*$",  # Current affairs
        r"^mailto:.*$",  # Mailto links
        r"^.*recover.*$",  # Recovery links
        r"^.*signup.*$",  # Signup links
        r"^.*checkpoint.*$",  # Checkpoint links
        r"^https?://(www\.linkedin\.com|twitter\.com|www\.facebook\.com|facebook\.com).*$",  # Social media
        r"^/nl/sitemap$",  # Sitemap
        r"^/nl/archief$",  # Archive
        r"^/nl/privacy$",  # Privacy policy
        r"^/nl/nieuwsbrieven-aanmelden$",  # Newsletter sign up
        r"^/nl/help-0$",  # Help
        r"^/nl/rss$",  # RSS feed
        r"^/en.*$",  # English pages
        r"^/nl/zoeken.*$",  # Search
        r"^/nl/welke-cookies-gebruikt-pianoonl.*$",  # Cookies policy
        r"^#.*$",  # Fragment links
        r"^/nl/nieuwsbrief-aanmelden.*$",  # Newsletter sign up
        r"^nl/$",  # Homepage
        r"^https://(?:www\.)?pianoo.nl/.*#.*$",  # Internal links with fragments
        r"^https?://(?!www\.pianoo\.nl).*",  # External links
        r"^https://www.pianoo.nl/(?!nl/inkoopproces/|nl/regelgeving/|nl/themas|nl/sectoren|nl/document|nl/over-pianoo|nl/sitemap).*",  # Specific internal links
    ]
    for pattern in IGNORED_LINKS:
        if re.match(pattern, link):
            return True
    return False


def save_data(links: List[PianooLink], file_path: str):
    """Save the collected data to a JSON file.

    Args:
        links (List[PianooLink]): List of PianooLink objects to save
        file_path (str): Path to the JSON file
    """
    if not os.path.exists(os.path.dirname(file_path)):
        os.makedirs(os.path.dirname(file_path))
    with open(f"{file_path}/links.json", "w+") as f:
        json.dump({"links": [c.url for c in links]}, f, indent=2)


def save_pianoo_link(link: PianooLink):

    clean_file_name = link.url.replace("https://www.pianoo.nl/", "").replace("/", "_")
    with open(f"{PIANOO_SAVE_PATH}/json/{clean_file_name}.json", "w+") as f:
        json.dump(
            {
                "title": link.title,
                "url": link.url,
                "description": link.description,
                "scraped_at": datetime.datetime.now().isoformat(),
            },
            f,
            indent=2,
        )
    with open(f"{PIANOO_SAVE_PATH}/txt/{clean_file_name}.txt", "w+") as f:

        def clean_text(text: str) -> str:
            return (
                text.replace("\n", " ")
                .replace("\r", " ")
                .replace("\t", " ")
                .replace("\xa0", " ")
                .strip()
                .encode("ascii", "ignore")
                .decode()
            )

        f.write(clean_text(f"{link.title}. {link.description}. {link.content}"))


def scrape_links(
    link: str, visited_links: set = None, links_to_return: List[PianooLink] = None
) -> List[PianooLink]:
    """Recursively scrape links from pianoo.

    Args:
        link (str): the current page
        visited_links (set, optional): set of links already visited
        links_to_return (List[PianooLink], optional): list to collect scraped data

    Returns:
        List[PianooLink]: list of scraped links
    """
    if visited_links is None:
        visited_links = set()
    if links_to_return is None:
        links_to_return = []

    if link.startswith("/"):
        link = f"https://www.pianoo.nl{link}"

    if len(links_to_return) >= PAGE_LIMIT:
        print(f"Reached limit of {PAGE_LIMIT} pages. Stopping.")
        return links_to_return

    if link in visited_links or is_ignored(link):
        return links_to_return

    visited_links.add(link)
    try:
        response = requests.get(link)
        response.raise_for_status()  # Check for HTTP errors
    except (
        requests.exceptions.RequestException,
        requests.exceptions.MissingSchema,
    ) as e:
        print(f"Error fetching {link}: {e}")
        return links_to_return

    soup = BeautifulSoup(response.text, "html.parser")
    links = soup.find_all("a", href=True)

    # Extract page content
    page_content = soup.find("div", {"role": "article"})
    if page_content:
        page_content = page_content.get_text()
    else:
        page_content = soup.find("body").get_text().strip()

    page_title = soup.title.string if soup.title else "No title"
    page_description = soup.find("meta", {"name": "description"})
    page_description = (
        page_description["content"] if page_description else "No description"
    )

    print(f"Scraping: {link}, Title: {page_title}, Pages: {len(links_to_return)}")

    # Add the current page to the list of PianooLink objects
    links_to_return.append(
        PianooLink(
            url=link,
            title=page_title,
            content=page_content,
            description=page_description,
        )
    )

    save_pianoo_link(links_to_return[-1])

    # Filter and scrape links found on the current page
    found_links = [l["href"] for l in links if not is_ignored(l["href"])]
    for new_link in found_links:
        if new_link.startswith("/"):
            new_link = f"https://www.pianoo.nl{new_link}"

        if new_link not in visited_links:
            links_to_return = scrape_links(new_link, visited_links, links_to_return)

    return links_to_return


if __name__ == "__main__":
    data = []
    try:
        if not os.path.exists(f"{PIANOO_SAVE_PATH}/txt/"):
            os.makedirs(f"{PIANOO_SAVE_PATH}/txt/")
        if not os.path.exists(f"{PIANOO_SAVE_PATH}/json/"):
            os.makedirs(f"{PIANOO_SAVE_PATH}/json/")
        # Start recursive scraping
        data = scrape_links(PIANOO_SITEMAP_URL)
    except Exception as e:
        print(f"Error scraping Pianoo: {e}")
    except KeyboardInterrupt:
        # this only works if we have finished at least one recursive scrape of a
        print("Scraping interrupted by user.")
