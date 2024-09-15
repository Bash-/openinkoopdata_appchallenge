from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from prompts import qa_eval_prompt


class RAGEvaluator:
    def __init__(self, rag_chain: Any, llm, tender_id: str):
        self.rag_chain = rag_chain
        self.llm = llm
        self.tender_id = tender_id
        self.eval_chain = self.setup_eval_chain()

    def setup_eval_chain(self):
        """
        Create an evaluation model for the LLM
        :return:

        Use like this
        prompt_value = eval_model.invoke(
        {
            "vraag": "What is your name?",
            "echt_antwoord": "Bob",
            "gegenereerd_antwoord": "Bart",
        })

        """

        prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", qa_eval_prompt),
                ("human", "De originele vraag is: {vraag}"),
                ("human", "Het echte antwoord is: {echt_antwoord}"),
                ("human", "Het gegenereerde antwoord is: {gegenereerd_antwoord}"),
            ]
        )

        # Use runnablesequence instead of LLMChain
        chain = prompt_template | self.llm | StrOutputParser()

        return chain

    def llm_eval(self, question: str, pred: str, truth: str) -> float:
        """
        Evaluate the LLM model.
        :param pred: str - The generated answer.
        :param truth: str - The correct answer.
        :return: float - The average score (0 if parsing fails).
        """
        # Attempt to get a valid score
        score = None
        for attempt in range(6):  # Try the initial attempt + 5 retries
            if attempt > 0:
                score = self.eval_chain.invoke(
                    {
                        "vraag": question,
                        "echt_antwoord": truth,
                        "gegenereerd_antwoord": pred,
                    }
                )

            try:
                score_int = int(score)
                return score_int / 5  # Return the score as a float divided by 5
            except (ValueError, TypeError):
                score = None  # Reset score in case of failure

        # If all attempts fail, return 0
        return 0.0

    def f1(self, pred: str, truth: str):
        """
        Calculate the F1 score
        :param pred: str
        :param truth: str
        :return: float score
        """
        pred_tokens = pred.split()
        truth_tokens = truth.split()
        common_tokens = set(pred_tokens) & set(truth_tokens)
        if len(common_tokens) == 0:
            return 0.0
        prec = len(common_tokens) / len(pred_tokens)
        rec = len(common_tokens) / len(truth_tokens)
        return 2 * (prec * rec) / (prec + rec)

    def cosine_similarity(self, pred: str, truth: str):
        """
        Calculate the cosine similarity
        :param pred: str
        :param truth: str
        :return: float score
        """
        vectorizer = TfidfVectorizer().fit([pred, truth])
        vectors = vectorizer.transform([pred, truth]).toarray()
        return cosine_similarity(vectors)[0, 1]

    def evaluate(self, qa_pairs):
        """
        Evaluate rag chain
        :param qa_pairs:
        :return: score dictionary
        """
        results = {"f1_score": [], "cosine_similarity": [], "llm_eval": []}
        new_qa_pairs = []

        for qa in qa_pairs:
            question, truth_answer = qa["vraag"], qa["antwoord"]

            generated_response = self.rag_chain.invoke(
                {"input": question, "chat_history": [], "tenderId": self.tender_id}
            )
            generated_answer = generated_response.get("answer")

            #
            qa["source_metadata"] = [
                x.metadata for x in generated_response.get("context")
            ]
            qa["generated_answer"] = generated_answer
            new_qa_pairs.append(qa)

            # Scoring
            f1 = self.f1(generated_answer, truth_answer)
            cosine_sim = self.cosine_similarity(generated_answer, truth_answer)
            llm_score = self.llm_eval(question, generated_answer, truth_answer)

            # Collect results
            results["f1_score"].append(f1)
            results["cosine_similarity"].append(cosine_sim)
            results["llm_eval"].append(llm_score)

        # Aggregate results
        avg_f1 = np.mean(results["f1_score"])
        avg_cosine = np.mean(results["cosine_similarity"])
        avg_llm = np.mean(results["llm_eval"])

        return {
            "avg_f1_score": avg_f1,
            "avg_cosine_similarity": avg_cosine,
            "avg_llm_eval": avg_llm,
        }, {"pairs": new_qa_pairs}
