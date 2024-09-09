from typing import List, Dict
import pandas as pd
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import PromptTemplate

from prompts import contextualize_q_system_prompt, question_groundedness_critique_prompt, question_relevance_critique_prompt, question_standalone_critique_prompt, eval_prompt


class QuestionGenerator:
    """Generates question answer pairs based on a given context"""
    def __init__(self, weaviate_client, llm):
        self.weaviate_client = weaviate_client
        self.llm = llm
        self.question_chain = self.setup_question_chain()
        self.critique_chains = self.setup_critique_chains()


    def setup_question_chain(self):
        prompt_template = PromptTemplate(input_variables=["instruction", "response", "reference_answer"], template=eval_prompt)
        chain = prompt_template | self.llm | StrOutputParser()
        return chain

    def setup_question_chain(self):
        prompt_template = PromptTemplate(input_variables=["context"], template=contextualize_q_system_prompt)
        chain = prompt_template | self.llm | StrOutputParser()
        return chain

    def setup_critique_chains(self):
        prompt_groundness = PromptTemplate(input_variables=["question", "context"], template=question_groundedness_critique_prompt)
        prompt_relevance = PromptTemplate(input_variables=["question"],
                                           template=question_relevance_critique_prompt)
        prompt_standalone = PromptTemplate(input_variables=["question"],
                                          template=question_standalone_critique_prompt)
        chain_groundness = prompt_groundness | self.llm | StrOutputParser()
        chain_relevance = prompt_relevance | self.llm | StrOutputParser()
        chain_standalone = prompt_standalone | self.llm | StrOutputParser()
        return {"groundness": chain_groundness, "relevance": chain_relevance, "standalone": chain_standalone}

    def retrieve_context(self, tenderId: str):
        response = (
            self.weaviate_client.query
            .get("Tender_documents", ["tenderId", "source", "page_content"])
            .with_where({"path": "tenderId", "operator": "Equal", "valueString": tenderId})
            .do()
        )

        # Only return the tender documents. key page_content contains the context
        return response.get("data").get("Get").get("Tender_documents")

    def generate(self, all_docs: List[Dict[str, str]], n_sample: int = 10):
        outputs = []
        for context in all_docs[:n_sample]:
            # Generate QA couple
            output_QA_couple = self.question_chain.invoke(
                    {
                        "context": context.get("page_content"),
                    }
                )

            try:
                question = output_QA_couple.split("Feitelijke vraag: ")[-1].split("Antwoord: ")[0]
                answer = output_QA_couple.split("Antwoord: ")[-1]
                outputs.append(
                    {
                        "context": context.get("page_content"),
                        "vraag": question,
                        "antwoord": answer,
                        "tender_id": context.get("tenderId"),
                        "document": context.get("source"),
                    }
                )
            except:
                continue

        return outputs

    def critique_score(self, outputs: List[Dict[str, str]]):
        for output in outputs:
            evaluations = {
                "groundedness": self.critique_chains["groundness"].invoke(
                    {
                        "question": output["vraag"],
                        "context": output["context"],
                    }
                    ),
                "relevance": self.critique_chains["relevance"].invoke(
                    {
                        "question": output["vraag"],
                    }
                    ),
                "standalone": self.critique_chains["standalone"].invoke(
                    {
                        "question": output["vraag"],
                    }
                    ),
            }
            try:
                for criterion, evaluation in evaluations.items():
                    score, eval = (
                        int(evaluation.split("Totale beoordeling: ")[-1].strip()),
                        evaluation.split("Totale beoordeling: ")[-2].split("Evaluatie: ")[1],
                    )
                    output.update(
                        {
                            f"{criterion}_score": score,
                            f"{criterion}_eval": eval,
                        }
                    )
            except Exception as e:
                continue
        return pd.DataFrame.from_dict(outputs)

    def filter_critique(self, generated_questions: pd.DataFrame):
        generated_questions = generated_questions.loc[
            (generated_questions["groundedness_score"] >= 4)
            & (generated_questions["relevance_score"] >= 4)
            & (generated_questions["standalone_score"] >= 4)
            ].to_dict(orient="records")
        return generated_questions

    def generate_questions(self, tender_id: str):
        context = self.retrieve_context(tender_id)
        questions = self.generate(context)
        scores = self.critique_score(questions)
        scores_filtered = self.filter_critique(scores)
        return scores_filtered


# tender_ids = ['345519', '346061', '347462', '341298', '344061', '341611', 'categorieplannen', '341216', '344951', '345700', '343281', '342551', '344609', '348149', '344465', '345697', '342374', '346048', '346113', '346057', '345848', '345672', '346733', '347484', '343523', '347444', '345587', '346644', '347348', '348173', '342512', '347344', '348038', '344069', '345577', '346252', '347965', '345772', '345699', '348275', '341286', '347485', '347354', '343710', '342386', '342228', '345706', '346135', '344729', '346625', '347922', '346608', '346619', '343719', '345819', '342367', '342038', '347476', '343697', '344738', '344702', '347358', '345397', '344050', '348074', '342902', '343126']
# WEAVIATE_URL = os.getenv("WEAVIATE_HOST")
# WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
# OPENAI_APIKEY = os.getenv("OPENAI_API_KEY")
#
# client = weaviate.Client(
#     url=WEAVIATE_URL,
#     auth_client_secret=weaviate.AuthApiKey(WEAVIATE_API_KEY),
#     additional_headers={"X-OpenAI-Api-Key": OPENAI_APIKEY},
# )
#
# OPENAI_APIKEY = os.getenv("OPENAI_API_KEY")
# llm = ChatOpenAI(
#     temperature=0.2, openai_api_key=OPENAI_APIKEY, model="gpt-4o-2024-08-06"
# )

# qc = QuestionGenerator(client, llm)
# context = qc.retrieve_context("345519")
# questions = qc.generate(context)
# scores = qc.critique_score(questions)
# scores_filtered = qc.filter_critique(scores)

