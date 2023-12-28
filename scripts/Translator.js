class Translator {
	constructor() {
		this.translations = {};
	}

	translate(key, language, ...args) {
		if (!this.translations[language] || !this.translations[language][key]) {
			return `Translation not available for "${key}" in ${language}.`;
		}

		const translation = this.translations[language][key];
		return this.formatTranslation(translation, ...args);
	}

	formatTranslation(translation, ...args) {
		return translation.replace(/\{\{(\d+)\}\}/g, (match, index) => {
			const argIndex = parseInt(index, 10);
			if (argIndex < args.length) {
				return args[argIndex];
			}
			return match;
		});
	}
}

// Exemple d'utilisation
const translator = new Translator();

// Charger les traductions pour différentes langues
translator.loadTranslations('en');
translator.loadTranslations('fr');

// Utilisation des traductions avec arguments
const name = 'Alice';
const age = 30;

const greetingEn = translator.translate('greeting', 'en', name); // Utilisation d'un argument
const welcomeMessageFr = translator.translate('welcomeMessage', 'fr', name, age); // Utilisation de plusieurs arguments