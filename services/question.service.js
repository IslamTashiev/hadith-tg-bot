const openaiController = require("../controllers/openai.controller");
const QuestionModel = require("../models/QuestionModel");

const getUserQuestions = async (userHadiths, userAnswers) => {
  const questions = await QuestionModel.find({ hadith: { $in: userHadiths }, _id: { $nin: userAnswers } });
  return questions;
};

const parseQuestion = (questionText) => {
  const questionMatch = questionText.match(/<query>(.*?)<\/query>/);
  const question = questionMatch ? questionMatch[1] : "";

  const answersMatch = [...questionText.matchAll(/<answ>(.*?)<\/answ>/g)];
  const answers = answersMatch.map((match) => match[1]);

  const correctAnswerMatch = questionText.match(/<correct>(.*?)<\/correct>/);
  const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : "";

  return {
    question,
    answers: [...answers, correctAnswer],
    correctAnswer,
  };
};

const saveQuestion = async (hadithId, questionText) => {
  const { answers, correctAnswer, question } = parseQuestion(questionText);
  let correct = correctAnswer;

  const editedAnswers = await Promise.all(
    answers.map(async (answer) => {
      if (answer.length >= 100) {
        const shortenAnswer = await shortenQuestion(answer);

        if (answer === correctAnswer) {
          correct = shortenAnswer;
        }

        return shortenAnswer;
      } else {
        return answer;
      }
    })
  );

  const newQuestion = new QuestionModel({ answers: editedAnswers, correctAnswer: correct, question, hadith: hadithId });
  const createdQuestion = await newQuestion.save();
  return createdQuestion;
};

const createQuestion = async (hadith) => {
  const question = await QuestionModel.findOne({ hadith: hadith.id });

  if (question) {
    return question;
  }

  const questionText = await openaiController.getQuestion(hadith);
  const createdQuestion = await saveQuestion(hadith.id, questionText.content);
  return createdQuestion;
};

const shortenQuestion = async (questionText) => {
  const question = await openaiController.shortenQuestion(questionText);
  return question;
};

module.exports = {
  createQuestion,
  getUserQuestions,
};
