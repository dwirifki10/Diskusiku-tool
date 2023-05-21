require('dotenv').config();
const Tesseract = require('tesseract.js');
const { Configuration, OpenAIApi } = require('openai');
const gTTS = require('gtts');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/* create date today */
let today = new Date();
let updated = today.toLocaleDateString('en-GB', { timeZone: 'UTC' }) 
			+ `-${today.getHours()}` + `:${today.getMinutes()}` + `:${today.getSeconds()}` + "-UTC-timezone";


const runChatGPT = async (cleanText, apiKey) => {
	try{
		/* configuration credentials */ 
		const configuration = new Configuration({
		    apiKey: apiKey || process.env.OPENAI_API_KEY
		});
		const openai = new OpenAIApi(configuration);
		/* run chatGPT and get result */ 
		const completion = await openai.createCompletion({
			model: "text-davinci-003",
			prompt: cleanText,
			n: 3,
			max_tokens: 2000,
			temperature: 0.8,
		});
		return completion;
	}catch(error) {
		return error;
	}
}

const deleteFilesController = async (req, res) => {
	try{
		const directories = [ './src/storage/images', './src/storage/audio' ] 
		/* deleting all files */
		await Promise.all(directories.map(async (directory) => {
			const files = await fs.promises.readdir(directory);
			console.log(files);
			for (const file of files) {
				await fs.promises.unlink(path.join(directory, file));
			}
		}));
		res.status(200).json({ result: true, deleted: updated });
	}catch(error) {
		res.status(500).json({ message: error.message });
	}
}

const tesseractController = async (req, res) => {
	try {
	    const image = req.file.path;
	    const { lang, prompt, apiKey, sound } = req.query; 
		/* process extracting image to text by using Tesseract Js */ 
	    const { data: {text} } = await Tesseract.recognize(image, lang);
	    /* if the prompt is true */
	    if(prompt === "true") {
	    	const cleanText = text.replace(/\n/g, " "); 
		   	const completion = await runChatGPT(cleanText, apiKey);
		   	/* convert text to audio */ 
		   	const audio =  await convertToAudio(cleanText, completion.data.choices[0].text.replace(/\n/g, " "), sound);
		   	/* return response */ 
		    res.status(200).json({ 
		    	question: text, 
		    	answer: completion.data.choices[0].text,
		    	cleanQuestion: cleanText,
		    	cleanAnswer: completion.data.choices[0].text.replace(/\n/g, " "), 
		    	audio: audio,
		    	removeFilesUrl: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/delete-files`,		    	
		    	created: updated 
		    });
	    }else {
	    	/* convert text to audio */
	    	const cleanText = text.replace(/\n/g, " "); 
	    	const audio =  await convertToAudio(cleanText, null, sound);
	    	/* return response */ 
	    	res.status(200).json({ 
	    		result: text,
	    		cleanText: cleanText, 
	    		audio: audio,
	    		removeFilesUrl: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/delete-files`,
	    		created: updated
	    	});
	    }
	} catch (error) {
	    res.status(500).json({ message: error.message });
	}
}

const convertToAudio = async (cleanText, completion, sound) => {
	try{
		const fileText = [ cleanText, completion ];
		const audioNames = [ uuidv4(), uuidv4() ];
		const countFiles = (completion == null) ? 0 : 1; 
		let result = null;
		/* do converting text to speech */ 
		for (let i = 0; i <= countFiles; i++) {
			const gtts = new gTTS(fileText[i], sound);
			await gtts.save(`./src/storage/audio/${ audioNames[i] }.mp3`, (err, result) => {
				if (err) { throw new Error(err) } 
			});
		}
		if (countFiles == 0) {
			result = `${ audioNames[0] }.mp3`;
		}else {
			result = [ `${ audioNames[0] }.mp3`, `${ audioNames[1] }.mp3` ];
		} 
		return result;
	}catch(error) {
		return error;
	}
}

module.exports = {
  tesseractController,
  deleteFilesController
};
