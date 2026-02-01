/**
 * RealtySoft Widget v7.1.4 - Optimized for n8n Backend
 *
 * CACHE BUSTING: This script auto-updates across all websites.
 * Embed using: <script src="https://your-cdn.com/chatbot.js"></script>
 * The script will automatically fetch the latest version.
 *
 * Changes from v7.3.0:
 * - Added 5 new languages: Polish (pl), Hungarian (hu), Danish (da), Swedish (sv), Norwegian (nb)
 * - Full translations for all UI elements in new languages
 *
 * Changes from v7.2.3:
 * - Added HTML lang attribute detection (<html lang="nl-NL"> → Dutch)
 * - No more need for forceLanguage if page has correct lang attribute
 *
 * Changes from v7.2.2:
 * - Fixed intro text being detected as property (added Dutch intro patterns)
 * - Translated property card labels (beds/baths/build/plot) per language
 * - Added price formatting with thousand separators
 *
 * Changes from v7.2.1:
 * - Added multilingual property parsing (Dutch: slaapkamers, badkamers, bebouwd, perceel)
 * - Fixed European price format (€1.100.000 with dots as thousand separators)
 *
 * Changes from v7.2.0:
 * - Added forceLanguage config option to override auto-detection
 * - Use: initRealtySoftEmbed({ forceLanguage: 'nl', ... })
 *
 * Changes from v7.1.2:
 * - Added support for UNNUMBERED properties (no "1.", "2." prefix)
 * - Property cards now work with both numbered and unnumbered formats
 *
 * Changes from v7.1.0:
 * - Added automatic cache busting mechanism
 * - Script self-updates when new version is deployed
 *
 * Changes from v7.0.4:
 * - Added multi-location support with location headings
 * - Properties now grouped by location (e.g., Mijas, Marbella)
 * - Shows 3 properties per location instead of 3 total
 *
 * Changes from v7.0.3:
 * - Simplified header: removed title, kept icon + buttons only
 * - Cleaner header layout
 *
 * Changes from v7.0.2:
 * - Rewrote property parsing for robust single-line detection
 * - Fixed View Property button text interpolation
 *
 * Changes from v7.0.1:
 * - Removed "Online" status from header
 *
 * Changes from v6.9.3:
 * - Fixed email transcript flow to work with n8n ChatBot workflow
 * - Added proper store_contact action handling
 */

(function() {
    'use strict';

    const VERSION = '7.3.4';
    const VERSION_TIMESTAMP = '20260122234000';

    // Mark as loaded (for debugging)
    window._realtySoftLoaded = VERSION + '-' + VERSION_TIMESTAMP;

    // Pre-compiled regex patterns
    const REGEX = {
        url: /https?:\/\/[^\s<>"'\[\]]+/gi,
        markdownLink: /\[([^\]]+)\]\(([^)]+)\)/g,
        propertyNumber: /^(\d+)[.)\s]+(.+)/,
        euroPrice: /[€£$]\s*[\d,]+(?:\.[\d]+)?/,
        refNumber: /([A-Z]?\d{5,})/i,
        buildSize: /([\d,]+)\s*m²?\s*(?:build|bebouwd|construido)/i,
        plotSize: /([\d,]+)\s*m²?\s*(?:plot|perceel|parcela|terrein)/i,
        combinedSize: /([\d,]+)\s*m²?\s*(?:build|bebouwd).*?\|.*?([\d,]+)\s*m²?\s*(?:plot|perceel)/i,
        bedsFromType: /\|\s*(\d+)\s*bed/i,
        bathsFromType: /\|\s*(\d+)\s*bath/i,
        // Patterns for single-line format: "🛏️ 6 beds | 🚿 6 baths 📐 701 m² build | 1623 m² plot"
        bedsBaths: /(\d+)\s*beds?\s*[\|,]?\s*\D*(\d+)\s*baths?/i,
        singleLineBeds: /(\d+)\s*beds?/i,
        singleLineBaths: /(\d+)\s*baths?/i,
        singleLineBuild: /([\d,]+)\s*m[²2]?\s*build/i,
        singleLinePlot: /([\d,]+)\s*m[²2]?\s*plot/i,
        singleLineRef: /ref[:\s]*([A-Z]?\d{5,})/i,
        singleLinePrice: /[€$]\s*([\d,]+(?:,\d{3})*)/i
    };

    // Translation Manager
    const TranslationManager = {
        cache: {},
        translations: {
            en: {
                botName: 'Property Assistant',
                welcomeMessage: 'Find your perfect property today!',
                welcomeButton: 'Let\'s Start',
                welcomeSubtext: 'Get instant property recommendations tailored to your needs.',
                contactFormText: 'Share your details to receive personalised recommendations and chat transcript.',
                fullName: 'Full Name',
                emailAddress: 'Email Address',
                phoneNumber: 'Phone Number',
                continueButton: 'Continue',
                skipButton: 'Skip this step',
                namePlaceholder: 'Your name',
                emailPlaceholder: 'your@email.com',
                phonePlaceholder: '+1 234 567 890',
                emailModalTitle: 'Email Required',
                emailModalText: 'Please provide your email to receive the chat transcript.',
                sendTranscriptButton: 'Send Transcript',
                cancelButton: 'Cancel',
                emailChatButton: 'Email Chat',
                resetButton: 'Reset',
                chatPlaceholder: 'Ask me anything...',
                chatEndedPlaceholder: 'Chat ended - transcript sent',
                typingIndicator: 'Typing...',
                greetingGuest: 'Hello! How can I help you today? Looking for properties, valuations, or market insights?',
                greetingUser: 'Hello {name}! How can I help you find your perfect property today?',
                noMessagesAlert: 'No messages to send. Start a conversation first!',
                transcriptSent: 'Perfect! Chat transcript sent to {email}. Have a great day!',
                errorSending: 'Error sending transcript. Please try again.',
                connectionError: 'Connection issue. Please try again.',
                resetConfirm: 'Start a new conversation? Current chat will be cleared.',
                fillRequired: 'Please fill in required fields',
                contactRequired: 'Please provide contact details to continue.',
                viewPropertyButton: 'View Property',
                sendingTranscript: 'Sending transcript...',
                endingChat: 'Ending chat...',
                propBeds: 'beds',
                propBaths: 'baths',
                propBuild: 'build',
                propPlot: 'plot',
                propLocation: 'Location',
                propType: 'Type'
            },
            nl: {
                botName: 'Vastgoed Assistent',
                welcomeMessage: 'Vind vandaag uw perfecte woning!',
                welcomeButton: 'Laten we beginnen',
                welcomeSubtext: 'Ontvang direct gepersonaliseerde vastgoedaanbevelingen.',
                contactFormText: 'Deel uw gegevens om aanbevelingen en chatgesprek te ontvangen.',
                fullName: 'Volledige Naam',
                emailAddress: 'E-mailadres',
                phoneNumber: 'Telefoonnummer',
                continueButton: 'Doorgaan',
                skipButton: 'Overslaan',
                namePlaceholder: 'Uw naam',
                emailPlaceholder: 'uw@email.nl',
                phonePlaceholder: '+31 6 12345678',
                emailModalTitle: 'E-mail Vereist',
                emailModalText: 'Geef uw e-mailadres op voor het chatgesprek.',
                sendTranscriptButton: 'Versturen',
                cancelButton: 'Annuleren',
                emailChatButton: 'E-mail',
                resetButton: 'Reset',
                chatPlaceholder: 'Vraag me...',
                chatEndedPlaceholder: 'Chat beëindigd',
                typingIndicator: 'Typen...',
                greetingGuest: 'Hallo! Waarmee kan ik u helpen? Vastgoed, taxaties of marktinzichten?',
                greetingUser: 'Hallo {name}! Hoe kan ik u helpen vandaag?',
                noMessagesAlert: 'Geen berichten. Begin eerst een gesprek!',
                transcriptSent: 'Perfect! Transcript verzonden naar {email}. Fijne dag!',
                errorSending: 'Fout bij verzenden. Probeer opnieuw.',
                connectionError: 'Verbindingsprobleem. Probeer opnieuw.',
                resetConfirm: 'Nieuw gesprek starten? Huidige chat wordt gewist.',
                fillRequired: 'Vul verplichte velden in',
                contactRequired: 'Vul contactgegevens in.',
                viewPropertyButton: 'Bekijk',
                sendingTranscript: 'Verzenden...',
                endingChat: 'Beëindigen...',
                propBeds: 'slaapkamers',
                propBaths: 'badkamers',
                propBuild: 'bebouwd',
                propPlot: 'perceel',
                propLocation: 'Locatie',
                propType: 'Type'
            },
            es: {
                botName: 'Asistente Inmobiliario',
                welcomeMessage: '¡Encuentre su propiedad perfecta!',
                welcomeButton: 'Empecemos',
                welcomeSubtext: 'Obtenga recomendaciones personalizadas al instante.',
                contactFormText: 'Comparta sus datos para recibir recomendaciones y transcripción.',
                fullName: 'Nombre Completo',
                emailAddress: 'Correo Electrónico',
                phoneNumber: 'Teléfono',
                continueButton: 'Continuar',
                skipButton: 'Omitir',
                namePlaceholder: 'Su nombre',
                emailPlaceholder: 'su@correo.com',
                phonePlaceholder: '+34 612 345 678',
                emailModalTitle: 'Correo Requerido',
                emailModalText: 'Proporcione su correo para recibir la transcripción.',
                sendTranscriptButton: 'Enviar',
                cancelButton: 'Cancelar',
                emailChatButton: 'Email',
                resetButton: 'Reiniciar',
                chatPlaceholder: 'Pregúntame...',
                chatEndedPlaceholder: 'Chat finalizado',
                typingIndicator: 'Escribiendo...',
                greetingGuest: '¡Hola! ¿Cómo puedo ayudarle? ¿Propiedades, valoraciones o mercado?',
                greetingUser: '¡Hola {name}! ¿Cómo puedo ayudarle hoy?',
                noMessagesAlert: 'Sin mensajes. ¡Inicie una conversación!',
                transcriptSent: '¡Perfecto! Transcripción enviada a {email}. ¡Buen día!',
                errorSending: 'Error al enviar. Intente de nuevo.',
                connectionError: 'Problema de conexión. Intente de nuevo.',
                resetConfirm: '¿Iniciar nueva conversación? El chat actual se borrará.',
                fillRequired: 'Complete los campos requeridos',
                contactRequired: 'Complete sus datos de contacto.',
                viewPropertyButton: 'Ver',
                sendingTranscript: 'Enviando...',
                endingChat: 'Finalizando...',
                propBeds: 'dormitorios',
                propBaths: 'baños',
                propBuild: 'construido',
                propPlot: 'parcela',
                propLocation: 'Ubicación',
                propType: 'Tipo'
            },
            pl: {
                botName: 'Asystent Nieruchomości',
                welcomeMessage: 'Znajdź swoją idealną nieruchomość!',
                welcomeButton: 'Rozpocznij',
                welcomeSubtext: 'Otrzymaj spersonalizowane rekomendacje nieruchomości.',
                contactFormText: 'Podaj swoje dane, aby otrzymać rekomendacje i transkrypcję czatu.',
                fullName: 'Imię i Nazwisko',
                emailAddress: 'Adres Email',
                phoneNumber: 'Numer Telefonu',
                continueButton: 'Kontynuuj',
                skipButton: 'Pomiń',
                namePlaceholder: 'Twoje imię',
                emailPlaceholder: 'twoj@email.pl',
                phonePlaceholder: '+48 123 456 789',
                emailModalTitle: 'Wymagany Email',
                emailModalText: 'Podaj swój email, aby otrzymać transkrypcję czatu.',
                sendTranscriptButton: 'Wyślij',
                cancelButton: 'Anuluj',
                emailChatButton: 'Email',
                resetButton: 'Reset',
                chatPlaceholder: 'Zapytaj mnie...',
                chatEndedPlaceholder: 'Czat zakończony',
                typingIndicator: 'Pisze...',
                greetingGuest: 'Cześć! Jak mogę Ci pomóc? Nieruchomości, wyceny lub informacje rynkowe?',
                greetingUser: 'Cześć {name}! Jak mogę Ci dzisiaj pomóc?',
                noMessagesAlert: 'Brak wiadomości. Rozpocznij rozmowę!',
                transcriptSent: 'Świetnie! Transkrypcja wysłana na {email}. Miłego dnia!',
                errorSending: 'Błąd wysyłania. Spróbuj ponownie.',
                connectionError: 'Problem z połączeniem. Spróbuj ponownie.',
                resetConfirm: 'Rozpocząć nową rozmowę? Obecny czat zostanie usunięty.',
                fillRequired: 'Wypełnij wymagane pola',
                contactRequired: 'Podaj dane kontaktowe.',
                viewPropertyButton: 'Zobacz',
                sendingTranscript: 'Wysyłanie...',
                endingChat: 'Kończenie...',
                propBeds: 'sypialnie',
                propBaths: 'łazienki',
                propBuild: 'zabudowa',
                propPlot: 'działka',
                propLocation: 'Lokalizacja',
                propType: 'Typ'
            },
            hu: {
                botName: 'Ingatlan Asszisztens',
                welcomeMessage: 'Találja meg álmai ingatlanát!',
                welcomeButton: 'Kezdjük',
                welcomeSubtext: 'Személyre szabott ingatlanajánlatok azonnal.',
                contactFormText: 'Adja meg adatait az ajánlatokhoz és a beszélgetés másolatához.',
                fullName: 'Teljes Név',
                emailAddress: 'Email Cím',
                phoneNumber: 'Telefonszám',
                continueButton: 'Tovább',
                skipButton: 'Kihagyás',
                namePlaceholder: 'Az Ön neve',
                emailPlaceholder: 'az@email.hu',
                phonePlaceholder: '+36 30 123 4567',
                emailModalTitle: 'Email Szükséges',
                emailModalText: 'Adja meg email címét a beszélgetés másolatához.',
                sendTranscriptButton: 'Küldés',
                cancelButton: 'Mégse',
                emailChatButton: 'Email',
                resetButton: 'Újra',
                chatPlaceholder: 'Kérdezzen...',
                chatEndedPlaceholder: 'Beszélgetés vége',
                typingIndicator: 'Ír...',
                greetingGuest: 'Szia! Miben segíthetek? Ingatlanok, értékbecslés vagy piaci információk?',
                greetingUser: 'Szia {name}! Miben segíthetek ma?',
                noMessagesAlert: 'Nincs üzenet. Kezdjen beszélgetést!',
                transcriptSent: 'Remek! Másolat elküldve: {email}. Szép napot!',
                errorSending: 'Hiba a küldéskor. Próbálja újra.',
                connectionError: 'Kapcsolati hiba. Próbálja újra.',
                resetConfirm: 'Új beszélgetés? A jelenlegi törlődik.',
                fillRequired: 'Töltse ki a kötelező mezőket',
                contactRequired: 'Adja meg elérhetőségét.',
                viewPropertyButton: 'Megtekint',
                sendingTranscript: 'Küldés...',
                endingChat: 'Befejezés...',
                propBeds: 'hálószoba',
                propBaths: 'fürdőszoba',
                propBuild: 'beépített',
                propPlot: 'telek',
                propLocation: 'Helyszín',
                propType: 'Típus'
            },
            da: {
                botName: 'Ejendomsassistent',
                welcomeMessage: 'Find din perfekte ejendom!',
                welcomeButton: 'Lad os starte',
                welcomeSubtext: 'Få personlige ejendomsanbefalinger med det samme.',
                contactFormText: 'Del dine oplysninger for at modtage anbefalinger og chatudskrift.',
                fullName: 'Fulde Navn',
                emailAddress: 'Email Adresse',
                phoneNumber: 'Telefonnummer',
                continueButton: 'Fortsæt',
                skipButton: 'Spring over',
                namePlaceholder: 'Dit navn',
                emailPlaceholder: 'din@email.dk',
                phonePlaceholder: '+45 12 34 56 78',
                emailModalTitle: 'Email Påkrævet',
                emailModalText: 'Angiv din email for at modtage chatudskriften.',
                sendTranscriptButton: 'Send',
                cancelButton: 'Annuller',
                emailChatButton: 'Email',
                resetButton: 'Nulstil',
                chatPlaceholder: 'Spørg mig...',
                chatEndedPlaceholder: 'Chat afsluttet',
                typingIndicator: 'Skriver...',
                greetingGuest: 'Hej! Hvordan kan jeg hjælpe? Ejendomme, vurderinger eller markedsindsigt?',
                greetingUser: 'Hej {name}! Hvordan kan jeg hjælpe dig i dag?',
                noMessagesAlert: 'Ingen beskeder. Start en samtale!',
                transcriptSent: 'Perfekt! Udskrift sendt til {email}. God dag!',
                errorSending: 'Fejl ved afsendelse. Prøv igen.',
                connectionError: 'Forbindelsesproblem. Prøv igen.',
                resetConfirm: 'Start ny samtale? Nuværende chat slettes.',
                fillRequired: 'Udfyld de påkrævede felter',
                contactRequired: 'Angiv kontaktoplysninger.',
                viewPropertyButton: 'Se',
                sendingTranscript: 'Sender...',
                endingChat: 'Afslutter...',
                propBeds: 'soveværelser',
                propBaths: 'badeværelser',
                propBuild: 'bygget',
                propPlot: 'grund',
                propLocation: 'Placering',
                propType: 'Type'
            },
            sv: {
                botName: 'Fastighetsassistent',
                welcomeMessage: 'Hitta din perfekta fastighet!',
                welcomeButton: 'Låt oss börja',
                welcomeSubtext: 'Få personliga fastighetsrekommendationer direkt.',
                contactFormText: 'Dela dina uppgifter för att få rekommendationer och chattutskrift.',
                fullName: 'Fullständigt Namn',
                emailAddress: 'E-postadress',
                phoneNumber: 'Telefonnummer',
                continueButton: 'Fortsätt',
                skipButton: 'Hoppa över',
                namePlaceholder: 'Ditt namn',
                emailPlaceholder: 'din@email.se',
                phonePlaceholder: '+46 70 123 45 67',
                emailModalTitle: 'E-post Krävs',
                emailModalText: 'Ange din e-post för att få chattutskriften.',
                sendTranscriptButton: 'Skicka',
                cancelButton: 'Avbryt',
                emailChatButton: 'E-post',
                resetButton: 'Återställ',
                chatPlaceholder: 'Fråga mig...',
                chatEndedPlaceholder: 'Chatt avslutad',
                typingIndicator: 'Skriver...',
                greetingGuest: 'Hej! Hur kan jag hjälpa dig? Fastigheter, värderingar eller marknadsinsikter?',
                greetingUser: 'Hej {name}! Hur kan jag hjälpa dig idag?',
                noMessagesAlert: 'Inga meddelanden. Starta en konversation!',
                transcriptSent: 'Perfekt! Utskrift skickad till {email}. Ha en bra dag!',
                errorSending: 'Fel vid sändning. Försök igen.',
                connectionError: 'Anslutningsproblem. Försök igen.',
                resetConfirm: 'Starta ny konversation? Nuvarande chatt raderas.',
                fillRequired: 'Fyll i obligatoriska fält',
                contactRequired: 'Ange kontaktuppgifter.',
                viewPropertyButton: 'Visa',
                sendingTranscript: 'Skickar...',
                endingChat: 'Avslutar...',
                propBeds: 'sovrum',
                propBaths: 'badrum',
                propBuild: 'byggt',
                propPlot: 'tomt',
                propLocation: 'Plats',
                propType: 'Typ'
            },
            nb: {
                botName: 'Eiendomsassistent',
                welcomeMessage: 'Finn din perfekte eiendom!',
                welcomeButton: 'La oss starte',
                welcomeSubtext: 'Få personlige eiendomsanbefalinger umiddelbart.',
                contactFormText: 'Del dine opplysninger for å motta anbefalinger og chattutskrift.',
                fullName: 'Fullt Navn',
                emailAddress: 'E-postadresse',
                phoneNumber: 'Telefonnummer',
                continueButton: 'Fortsett',
                skipButton: 'Hopp over',
                namePlaceholder: 'Ditt navn',
                emailPlaceholder: 'din@email.no',
                phonePlaceholder: '+47 123 45 678',
                emailModalTitle: 'E-post Påkrevd',
                emailModalText: 'Oppgi e-posten din for å motta chattutskriften.',
                sendTranscriptButton: 'Send',
                cancelButton: 'Avbryt',
                emailChatButton: 'E-post',
                resetButton: 'Nullstill',
                chatPlaceholder: 'Spør meg...',
                chatEndedPlaceholder: 'Chat avsluttet',
                typingIndicator: 'Skriver...',
                greetingGuest: 'Hei! Hvordan kan jeg hjelpe? Eiendommer, verdivurderinger eller markedsinnsikt?',
                greetingUser: 'Hei {name}! Hvordan kan jeg hjelpe deg i dag?',
                noMessagesAlert: 'Ingen meldinger. Start en samtale!',
                transcriptSent: 'Perfekt! Utskrift sendt til {email}. Ha en fin dag!',
                errorSending: 'Feil ved sending. Prøv igjen.',
                connectionError: 'Tilkoblingsproblem. Prøv igjen.',
                resetConfirm: 'Starte ny samtale? Nåværende chat slettes.',
                fillRequired: 'Fyll ut obligatoriske felt',
                contactRequired: 'Oppgi kontaktinformasjon.',
                viewPropertyButton: 'Se',
                sendingTranscript: 'Sender...',
                endingChat: 'Avslutter...',
                propBeds: 'soverom',
                propBaths: 'bad',
                propBuild: 'bygget',
                propPlot: 'tomt',
                propLocation: 'Sted',
                propType: 'Type'
            }
        },
        get(lang) {
            if (!this.cache[lang]) {
                this.cache[lang] = this.translations[lang] || this.translations.en;
            }
            return this.cache[lang];
        }
    };

    // Storage Manager
    const StorageManager = {
        keys: { state: 'realty_state', sessionId: 'realty_session_id' },

        saveState(userInfo, messages, chatEnded = false) {
            try {
                localStorage.setItem(this.keys.state, JSON.stringify({
                    userInfo, messages, chatEnded,
                    lastActivity: new Date().toISOString()
                }));
            } catch (e) {}
        },

        loadState() {
            try {
                const data = localStorage.getItem(this.keys.state);
                return data ? JSON.parse(data) : null;
            } catch (e) { return null; }
        },

        clearState() {
            try {
                localStorage.removeItem(this.keys.state);
                localStorage.removeItem(this.keys.sessionId);
            } catch (e) {}
        },

        getSessionId() {
            try {
                let id = localStorage.getItem(this.keys.sessionId);
                if (!id) {
                    id = 'rs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem(this.keys.sessionId, id);
                }
                return id;
            } catch (e) {
                return 'rs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
        },

        checkExpiration(days = 7) {
            try {
                const state = this.loadState();
                if (state?.lastActivity) {
                    const daysSince = (new Date() - new Date(state.lastActivity)) / (1000 * 60 * 60 * 24);
                    if (daysSince > days) {
                        this.clearState();
                        return true;
                    }
                }
                return false;
            } catch (e) { return false; }
        }
    };

    class RealtySoftWidget {
        constructor(config) {
            if (!config.webhookUrl && !config.webhooks) return;

            this.config = config;
            this.detectLanguage();
            this.sessionId = StorageManager.getSessionId();
            this.translations = TranslationManager.get(this.currentLanguage);

            const langConfig = config.languages?.[this.currentLanguage] || {};

            this.clientConfig = {
                botName: langConfig.botName || config.botName || this.translations.botName,
                primaryColor: config.primaryColor || '#4f46e5',
                secondaryColor: config.secondaryColor || '#3b82f6',
                welcomeMessage: langConfig.welcomeMessage || config.welcomeMessage || this.translations.welcomeMessage,
                welcomeIcon: langConfig.welcomeIcon || config.welcomeIcon || '🏡',
                welcomeDescription: langConfig.welcomeDescription || config.welcomeDescription || this.translations.welcomeSubtext,
                avatarUrl: langConfig.avatarUrl || config.avatarUrl || 'https://realtysoft.ai/n8n/bot.jpg',
                requireContact: config.requireContact !== false
            };

            this.iframe = null;
            this.state = { isOpen: false, initialized: false };

            StorageManager.checkExpiration(config.chatExpirationDays || 7);
            this.init();
        }

        detectLanguage() {
            // Check for forced language first (overrides auto-detection)
            if (this.config.forceLanguage) {
                this.currentLanguage = this.config.forceLanguage.toLowerCase();
                this.setWebhook();
                return;
            }

            const urlPath = window.location.pathname.toLowerCase();
            const pathMatch = urlPath.match(/\/(nl|es|en|fr|de|it|pt|pl|hu|da|sv|nb)\//);
            if (pathMatch) { this.currentLanguage = pathMatch[1]; this.setWebhook(); return; }

            const subdomain = window.location.hostname.split('.')[0].toLowerCase();
            if (['nl', 'es', 'en', 'fr', 'de', 'it', 'pt', 'pl', 'hu', 'da', 'sv', 'nb'].includes(subdomain)) {
                this.currentLanguage = subdomain; this.setWebhook(); return;
            }

            const langParam = new URLSearchParams(window.location.search).get('lang');
            if (langParam) { this.currentLanguage = langParam.toLowerCase(); this.setWebhook(); return; }

            // Check HTML lang attribute (e.g., <html lang="nl-NL"> or <html lang="nl">)
            const htmlLang = document.documentElement.lang;
            if (htmlLang) {
                const lang = htmlLang.split('-')[0].toLowerCase();
                if (['nl', 'es', 'en', 'fr', 'de', 'it', 'pt', 'pl', 'hu', 'da', 'sv', 'nb'].includes(lang)) {
                    this.currentLanguage = lang;
                    this.setWebhook();
                    return;
                }
            }

            this.currentLanguage = navigator.language.split('-')[0].toLowerCase();
            this.setWebhook();
        }

        setWebhook() {
            this.webhookUrl = this.config.webhooks?.[this.currentLanguage] ||
                             this.config.webhooks?.en ||
                             this.config.webhookUrl ||
                             Object.values(this.config.webhooks || {})[0];
        }

        init() {
            this.createButton();
            this.attachEventListeners();
            this.state.initialized = true;
        }

        createButton() {
            if (document.getElementById('realty-container')) return;

            const container = document.createElement('div');
            container.id = 'realty-container';

            const button = document.createElement('button');
            button.id = 'realty-toggle';
            button.innerHTML = '💬';

            this.injectStyles();
            container.appendChild(button);
            document.body.appendChild(container);
            this.toggleButton = button;
        }

        injectStyles() {
            if (document.getElementById('realty-styles')) return;

            const style = document.createElement('style');
            style.id = 'realty-styles';
            style.textContent = `
                #realty-container{position:fixed;right:20px;bottom:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
                #realty-toggle{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,${this.clientConfig.primaryColor},${this.clientConfig.secondaryColor});border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .3s;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px}
                #realty-toggle:hover{transform:scale(1.1)}
                #realty-iframe{position:fixed;bottom:90px;right:20px;width:380px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.2);display:none;z-index:999998;background:#fff}
                @media(max-width:480px){#realty-iframe{width:95vw;height:80vh;left:2.5vw;right:2.5vw}}
            `;
            document.head.appendChild(style);
        }

        createIframe() {
            if (this.iframe) return;
            this.iframe = document.createElement('iframe');
            this.iframe.id = 'realty-iframe';
            document.body.appendChild(this.iframe);
            this.setupIframeContent();
        }

        setupIframeContent() {
            const doc = this.iframe.contentDocument;
            doc.open();
            doc.write(this.getIframeHTML());
            doc.close();
        }

        getIframeHTML() {
            const cfg = this.clientConfig;
            const t = this.translations;

            return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chat</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;height:100vh;background:#fff}
.container{display:flex;flex-direction:column;height:100%}
.header{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.avatar{width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
.avatar img{width:100%;height:100%;object-fit:cover}
.header-actions{display:flex;gap:8px;align-items:center}
.header-btn{background:rgba(255,255,255,.2);border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;transition:all .2s}
.header-btn:hover{background:rgba(255,255,255,.3)}
.header-btn:disabled{opacity:.5;cursor:not-allowed}
.close{background:rgba(255,255,255,.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px}
.welcome{padding:40px 30px;text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;background:#f8fafc}
.welcome-icon{font-size:60px;margin-bottom:20px}
.welcome h2{color:#1f2937;margin-bottom:10px;font-size:20px;font-weight:700}
.welcome p{color:#6b7280;margin-bottom:30px;font-size:14px}
.btn{padding:14px 28px;background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:16px;transition:all .2s}
.btn:hover{transform:translateY(-2px);opacity:.95}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.form{padding:30px;display:none;flex:1;overflow-y:auto;background:#f8fafc}
.form.active{display:block}
.form p{color:#6b7280;margin-bottom:25px;font-size:14px}
.form-group{margin-bottom:20px}
.form-group label{display:block;margin-bottom:6px;font-weight:500;color:#374151;font-size:14px}
.form-group input{width:100%;padding:12px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;transition:border-color .2s}
.form-group input:focus{outline:none;border-color:${cfg.primaryColor}}
.form-buttons{display:flex;gap:10px;margin-top:20px}
.btn-primary{flex:1}
.btn-secondary{background:transparent;color:#6b7280;border:2px solid #e5e7eb}
.btn-secondary:hover{background:#f3f4f6;transform:none}
.chat{flex:1;padding:20px;overflow-y:auto;display:none;flex-direction:column;gap:15px;background:#f8fafc;scroll-behavior:smooth}
.chat.active{display:flex}
.message{display:flex;max-width:85%}
.message.user{align-self:flex-end}
.message.bot{align-self:flex-start;max-width:100%}
.msg-content{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.5}
.message.user .msg-content{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;border-bottom-right-radius:4px}
.message.bot .msg-content{background:#fff;color:#374151;border:1px solid #e5e7eb;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;z-index:1000}
.modal-overlay.active{display:flex}
.modal{background:#fff;border-radius:16px;padding:30px;max-width:90%;width:400px;box-shadow:0 8px 32px rgba(0,0,0,.2)}
.modal h3{margin-bottom:10px;color:#1f2937;font-size:18px}
.modal p{color:#6b7280;margin-bottom:20px;font-size:14px}
.property-card{background:linear-gradient(to bottom,#fff,#f9fafb);border:2px solid #e5e7eb;border-radius:12px;padding:18px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,.08);border-left:4px solid ${cfg.primaryColor};transition:all .2s}
.property-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.12)}
.property-title{font-weight:700;color:#1f2937;font-size:16px;margin-bottom:14px;line-height:1.4}
.property-details{margin:12px 0}
.property-detail-row{display:flex;align-items:flex-start;margin:6px 0;font-size:14px;line-height:1.6}
.detail-label{font-weight:600;color:#4b5563;min-width:90px;flex-shrink:0}
.detail-value{color:#6b7280;flex:1}
.property-price{font-size:18px;font-weight:700;color:${cfg.primaryColor};margin:12px 0}
.property-link{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff!important;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;margin-top:12px;transition:all .2s}
.property-link:hover{opacity:.9;transform:scale(1.02)}
.show-more-btn{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;transition:all .2s;margin:20px auto;display:block}
.show-more-btn:hover{transform:translateY(-2px);opacity:.9}
.show-more-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.regular-text{line-height:1.6;color:#374151}
.regular-text a{color:${cfg.primaryColor};text-decoration:none;font-weight:500}
.regular-text a:hover{text-decoration:underline}
.input-area{padding:20px;border-top:1px solid #e5e7eb;display:none;align-items:center;gap:10px;background:#fff}
.input-area.active{display:flex}
.input-area input{flex:1;padding:12px 16px;border:2px solid #e5e7eb;border-radius:25px;font-size:14px}
.input-area input:focus{outline:none;border-color:${cfg.primaryColor}}
.input-area input:disabled{background:#f3f4f6;color:#9ca3af}
.send{width:40px;height:40px;border-radius:50%;background:${cfg.primaryColor};border:none;cursor:pointer;color:#fff;font-size:16px;transition:all .2s}
.send:hover{opacity:.9}
.send:disabled{opacity:.5;cursor:not-allowed}
.typing{padding:12px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;width:fit-content;display:none;font-size:14px;color:#6b7280;margin-left:0}
.typing.active{display:block}
.status-msg{padding:10px 16px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:13px;color:#92400e;margin:10px 0;text-align:center}
.status-msg.success{background:#d1fae5;border-color:#6ee7b7;color:#065f46}
.status-msg.error{background:#fee2e2;border-color:#fca5a5;color:#991b1b}
</style>
</head><body>
<div class="container">
  <div class="header">
    <div class="avatar"><img src="${cfg.avatarUrl}" alt="Bot"></div>
    <div class="header-actions">
      <button class="header-btn" id="emailBtn" data-action="email-chat">${t.emailChatButton}</button>
      <button class="header-btn" id="resetBtn" data-action="reset">${t.resetButton}</button>
      <button class="close" data-action="close">×</button>
    </div>
  </div>

  <div class="welcome" id="welcome">
    <div class="welcome-icon">${cfg.welcomeIcon}</div>
    <h2>${cfg.welcomeMessage}</h2>
    <p>${cfg.welcomeDescription}</p>
    <button class="btn" data-action="show-contact">${t.welcomeButton}</button>
  </div>

  <div class="form" id="contactForm">
    <p>${t.contactFormText}</p>
    <form id="contact-form">
      <div class="form-group">
        <label>${t.fullName} *</label>
        <input type="text" name="name" required placeholder="${t.namePlaceholder}">
      </div>
      <div class="form-group">
        <label>${t.emailAddress} *</label>
        <input type="email" name="email" required placeholder="${t.emailPlaceholder}">
      </div>
      <div class="form-group">
        <label>${t.phoneNumber}</label>
        <input type="tel" name="phone" placeholder="${t.phonePlaceholder}">
      </div>
      <div class="form-buttons">
        <button type="submit" class="btn btn-primary">${t.continueButton}</button>
        <button type="button" class="btn btn-secondary" data-action="skip" ${cfg.requireContact ? 'style="display:none"' : ''}>${t.skipButton}</button>
      </div>
    </form>
  </div>

  <div class="modal-overlay" id="emailModal">
    <div class="modal">
      <h3>${t.emailModalTitle}</h3>
      <p>${t.emailModalText}</p>
      <form id="email-modal-form">
        <div class="form-group">
          <label>${t.emailAddress} *</label>
          <input type="email" name="modalEmail" required placeholder="${t.emailPlaceholder}">
        </div>
        <div class="form-buttons">
          <button type="submit" class="btn btn-primary" id="modalSubmitBtn">${t.sendTranscriptButton}</button>
          <button type="button" class="btn btn-secondary" data-action="close-modal">${t.cancelButton}</button>
        </div>
      </form>
    </div>
  </div>

  <div class="chat" id="chat"></div>
  <div class="typing" id="typing">${t.typingIndicator}</div>

  <div class="input-area" id="inputArea">
    <input type="text" placeholder="${t.chatPlaceholder}" id="chatInput">
    <button class="send" id="sendBtn" data-action="send">→</button>
  </div>
</div>

<script>
const REGEX = {
    buildSize: /([\d,]+)\\s*m²\\s*(?:build|bebouwd|construido)/i,
    plotSize: /([\d,]+)\\s*m²\\s*(?:plot|perceel|parcela|terrein)/i,
    combinedSize: /([\d,]+)\\s*m²\\s*(?:build|bebouwd).*?\\|.*?([\d,]+)\\s*m²\\s*(?:plot|perceel)/i,
    bedsFromType: /\\|\\s*(\\d+)\\s*bed/i,
    bathsFromType: /\\|\\s*(\\d+)\\s*bath/i,
    euroPrice: /[€£$]\\s*[\\d,]+(?:\\.[\\d]+)?/,
    refNumber: /([A-Z]?\\d{5,})/i,
    propertyNumber: /^(\\d+)[.)\\s]+(.+)/,
    markdownLink: /\\[([^\\]]+)\\]\\(([^)]+)\\)/g,
    url: /https?:\\/\\/[^\\s<>"'\\[\\]]+/gi
};

let userInfo = null;
let messages = [];
let isTyping = false;
let chatEnded = false;
const t = ${JSON.stringify(t)};
const cfg = ${JSON.stringify(cfg)};

// Load saved state
(function loadState() {
    try {
        const state = parent.StorageManager?.loadState();
        if (!state) return;

        userInfo = state.userInfo;
        messages = state.messages || [];
        chatEnded = state.chatEnded || false;

        if (userInfo && messages.length > 0) {
            document.getElementById('welcome').style.display = 'none';
            document.getElementById('contactForm').classList.remove('active');
            document.getElementById('chat').classList.add('active');
            document.getElementById('inputArea').classList.add('active');

            messages.forEach(msg => addMessageToDOM(msg.type, msg.content));

            if (chatEnded) {
                disableChat();
            }
        }
    } catch (e) {}
})();

function saveState() {
    try {
        parent.StorageManager?.saveState(userInfo, messages, chatEnded);
    } catch (e) {}
}

function setLoading(isLoading, message = '') {
    const emailBtn = document.getElementById('emailBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sendBtn = document.getElementById('sendBtn');
    const input = document.getElementById('chatInput');

    if (isLoading) {
        emailBtn.disabled = true;
        resetBtn.disabled = true;
        sendBtn.disabled = true;
        input.disabled = true;
    } else {
        emailBtn.disabled = chatEnded;
        resetBtn.disabled = false;
        sendBtn.disabled = chatEnded;
        input.disabled = chatEnded;
    }
}

function disableChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const emailBtn = document.getElementById('emailBtn');

    input.disabled = true;
    input.placeholder = t.chatEndedPlaceholder;
    sendBtn.disabled = true;
    emailBtn.disabled = true;
    chatEnded = true;
    saveState();
}

// Event delegation
document.addEventListener('click', function(e) {
    const action = e.target.dataset?.action;
    if (!action) return;
    e.preventDefault();

    switch(action) {
        case 'close': parent.closeWidget(); break;
        case 'email-chat': handleEmailChat(); break;
        case 'reset': resetChat(); break;
        case 'show-contact': showContactForm(); break;
        case 'skip': skipContact(); break;
        case 'close-modal': closeEmailModal(); break;
        case 'send': sendMessage(); break;
    }
});

// Form submissions
document.getElementById('contact-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const phone = formData.get('phone')?.trim() || '';

    if (!name || !email) {
        alert(t.fillRequired);
        return;
    }

    userInfo = { name, email, phone, skipped: false };

    // Store contact in backend
    try {
        await parent.sendToBackend({
            action: 'store_contact',
            sessionId: parent.sessionId,
            name, email, phone
        });
    } catch (e) {}

    saveState();
    startChat();
});

document.getElementById('email-modal-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('modalEmail')?.trim();

    if (!email) {
        alert(t.fillRequired);
        return;
    }

    if (!userInfo) {
        userInfo = { name: 'Guest', email, phone: '', skipped: true };
    } else {
        userInfo.email = email;
    }

    saveState();
    closeEmailModal();
    await endChatAndSendTranscript(email);
});

document.getElementById('chatInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function handleEmailChat() {
    if (messages.length === 0) {
        alert(t.noMessagesAlert);
        return;
    }

    if (!userInfo?.email?.trim()) {
        showEmailModal();
        return;
    }

    await endChatAndSendTranscript(userInfo.email);
}

function showEmailModal() {
    document.getElementById('emailModal').classList.add('active');
    const input = document.querySelector('[name="modalEmail"]');
    if (userInfo?.email) input.value = userInfo.email;
    input?.focus();
}

function closeEmailModal() {
    document.getElementById('emailModal').classList.remove('active');
}

async function endChatAndSendTranscript(email) {
    setLoading(true, t.endingChat);

    try {
        // First, store/update contact info
        await parent.sendToBackend({
            action: 'store_contact',
            sessionId: parent.sessionId,
            name: userInfo?.name || 'Guest',
            email: email,
            phone: userInfo?.phone || ''
        });

        // Then send endChat to trigger email
        const response = await parent.sendToBackend({
            action: 'endChat',
            sessionId: parent.sessionId,
            chatInput: 'bye',
            name: userInfo?.name || 'Guest',
            email: email,
            phone: userInfo?.phone || ''
        });

        setLoading(false);

        // Add success message
        const successMsg = t.transcriptSent.replace('{email}', email);
        addMessage('bot', successMsg);

        disableChat();

    } catch (error) {
        setLoading(false);
        addMessage('bot', t.errorSending);
    }
}

function resetChat() {
    if (!confirm(t.resetConfirm)) return;

    parent.StorageManager?.clearState();
    userInfo = null;
    messages = [];
    chatEnded = false;

    // Reset UI
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const emailBtn = document.getElementById('emailBtn');

    input.disabled = false;
    input.placeholder = t.chatPlaceholder;
    sendBtn.disabled = false;
    emailBtn.disabled = false;

    document.getElementById('chat').innerHTML = '';
    document.getElementById('chat').classList.remove('active');
    document.getElementById('inputArea').classList.remove('active');
    document.getElementById('contactForm').classList.remove('active');
    document.getElementById('welcome').style.display = 'flex';

    document.getElementById('contact-form')?.reset();
    parent.createNewSession();
}

function showContactForm() {
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('contactForm').classList.add('active');
    document.querySelector('[name="name"]')?.focus();
}

function skipContact() {
    userInfo = { name: 'Guest', email: '', phone: '', skipped: true };
    saveState();
    startChat();
}

function startChat() {
    document.getElementById('contactForm').classList.remove('active');
    document.getElementById('chat').classList.add('active');
    document.getElementById('inputArea').classList.add('active');

    if (messages.length === 0) {
        const greeting = userInfo.skipped
            ? t.greetingGuest
            : t.greetingUser.replace('{name}', userInfo.name);
        addMessage('bot', greeting);
    }

    document.getElementById('chatInput').focus();
}

function addMessageToDOM(type, content) {
    const chat = document.getElementById('chat');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + type;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    contentDiv.innerHTML = type === 'bot' ? formatMessage(content) : escapeHtml(content);

    msgDiv.appendChild(contentDiv);
    chat.appendChild(msgDiv);

    requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
    });
}

function addMessage(type, content) {
    addMessageToDOM(type, content);
    messages.push({ type, content, timestamp: new Date().toISOString() });
    saveState();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function cleanUrl(url) {
    return url.replace(/[)\\]}>.,;:!?]+$/, '').trim();
}

function cleanMarkdown(text) {
    return text
        .replace(/\\*\\*([^*]+)\\*\\*/g, '$1')
        .replace(/\\*([^*]+)\\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .trim();
}

function convertMarkdownLinks(text) {
    return text.replace(REGEX.markdownLink, (match, linkText, url) => {
        return '<a href="' + cleanUrl(url) + '" target="_blank">' + linkText + '</a>';
    });
}

function isPropertyListing(content) {
    const patterns = [
        /\\d+\\..*(?:apartment|villa|house|property|penthouse)/i,
        /(?:bedrooms?|beds?)\\s*[:.]?\\s*\\d/i,
        /ref[:\\s]*[A-Z]?\\d{5,}/i,
        /[€£$]\\s*[\\d,]+/i,
        /(?:found|here are|showing|properties)/i
    ];
    return patterns.filter(p => p.test(content)).length >= 2;
}

function formatMessage(content) {
    return isPropertyListing(content) ? formatPropertyListing(content) : formatRegularMessage(content);
}

function formatRegularMessage(content) {
    let text = convertMarkdownLinks(content);
    text = cleanMarkdown(text);
    text = text.replace(/(^|[^"'>])(https?:\\/\\/[^\\s<>"'\\[\\]]+)/gi, (m, p, url) => {
        return p + '<a href="' + cleanUrl(url) + '" target="_blank">View Details</a>';
    });
    text = text.replace(/\\n/g, '<br>');
    return '<div class="regular-text">' + text + '</div>';
}

function formatPropertyListing(content) {
    const lines = content.split('\\n');

    // Check if this is a multi-location response
    // Look for short bold headings that are likely location names (Mijas, Marbella, etc.)
    const hasLocationHeadings = lines.some(line => {
        const trimmed = line.trim();
        const match = trimmed.match(/^\\*\\*([^*]+)\\*\\*$/);
        if (!match) return false;
        const text = match[1].trim();
        // Location heading: short (< 25 chars), no property keywords
        return text.length < 25 && !/for sale|apartment|villa|house|penthouse|townhouse/i.test(text);
    });

    if (hasLocationHeadings) {
        return formatMultiLocationListing(content, lines);
    }

    // Single location - original logic
    const state = { properties: [], current: null, intro: '', outro: '', urls: [] };

    // Extract URLs
    for (let line of lines) {
        const matches = [...line.matchAll(REGEX.markdownLink)];
        for (let m of matches) {
            const url = cleanUrl(m[2]);
            if (url.includes('ref_no=') || url.includes('/property')) state.urls.push(url);
        }
    }

    let inOutro = false;
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (inOutro) { state.outro += ' ' + cleanMarkdown(line); continue; }

        const propMatch = line.match(REGEX.propertyNumber);
        if (propMatch) {
            let fullText = propMatch[2];

            // Check if this is a REAL property listing or intro text
            // Real property: STARTS with property type (e.g., "Townhouse in Estepona")
            // Intro: mentions property type as criteria (e.g., "...voor een townhouse...")
            const startsWithPropertyType = /^\\s*(villa|apartment|townhouse|penthouse|house|bungalow|duplex|flat|chalet|finca|country|detached|semi-detached|terraced|ground floor|vrijstaand|geschakeld|begane grond|piso|casa|atico|adosado|pareado|luxury|modern|beautiful|stunning|spacious|elegant)/i;
            const introKeywords = /gevonden|woningen|aanbevolen|found|showing|here are|properties|encontrado|propiedades|znaleziono|nieruchomości|találtam|ingatlan|fundet|boliger|hittade|fastigheter|funnet|eiendommer|criteria|top \\d|Ik heb|He encontrado|I found/i;

            // If line has intro keywords and does NOT start with property type, it's intro
            if (introKeywords.test(fullText) && !startsWithPropertyType.test(fullText)) {
                const cleanedLine = fullText.trim();
                if (!state.properties.length) {
                    state.intro += (state.intro ? ' ' : '') + cleanMarkdown(cleanedLine);
                }
                continue;
            }

            if (state.current) state.properties.push(state.current);

            let title = fullText;

            // Extract title: everything before first data pattern (emoji, beds, €, ref, m²)
            const dataPatterns = [
                /\\s+\\d+\\s*beds?/i,      // " 6 beds"
                /\\s+€/,                   // " €"
                /\\s+ref[:\\s]/i,          // " ref:" or " Ref "
                /\\s+\\d+\\s*m[²2]/i,      // " 701 m²"
                /[🛏🚿📐🔑💰🔗]/           // emojis
            ];

            let titleEnd = fullText.length;
            for (const pattern of dataPatterns) {
                const match = fullText.search(pattern);
                if (match > 0 && match < titleEnd) {
                    titleEnd = match;
                }
            }

            title = fullText.substring(0, titleEnd).trim();

            state.current = {
                number: parseInt(propMatch[1]),
                title: cleanMarkdown(title),
                location: '', type: '', bedrooms: '', bathrooms: '',
                buildSize: '', plotSize: '', price: '', ref: '', url: ''
            };

            // Process the full line for data extraction
            processPropertyLine(fullText, state.current);
            continue;
        }

        if (state.current) {
            processPropertyLine(line, state.current);
            if (/more options|complete details|feel free/i.test(line)) {
                inOutro = true;
                state.outro = cleanMarkdown(line);
            }
        }
    }

    if (state.current) state.properties.push(state.current);

    // If no numbered properties found, try parsing UNNUMBERED properties
    if (state.properties.length === 0) {
        let propNum = 0;
        let currentProp = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Skip intro/outro lines
            if (/found|here are|showing|let me know|refine/i.test(line) && !currentProp) {
                state.intro = cleanMarkdown(line);
                continue;
            }

            // Detect property title: contains property type keywords and "for sale/rent" or location
            const isPropertyTitle = /(?:villa|apartment|townhouse|penthouse|house|bungalow|duplex|flat|property|ground floor)\\s+(?:for\\s+(?:sale|rent)|in\\s+)/i.test(line);

            if (isPropertyTitle) {
                // Save previous property
                if (currentProp) state.properties.push(currentProp);

                propNum++;
                let title = line.replace(/\\*\\*/g, '').trim();
                currentProp = {
                    number: propNum,
                    title: title,
                    location: '', type: '', bedrooms: '', bathrooms: '',
                    buildSize: '', plotSize: '', price: '', ref: '', url: ''
                };
                continue;
            }

            // Process data lines for current property
            if (currentProp) {
                processPropertyLine(line, currentProp);

                // Check for View Property link
                const linkMatch = line.match(/\\[([^\\]]+)\\]\\(([^)]+)\\)/);
                if (linkMatch && /view|details|property/i.test(linkMatch[1])) {
                    currentProp.url = cleanUrl(linkMatch[2]);
                }
            }

            // Outro detection
            if (/let me know|refine your search|more options/i.test(line)) {
                if (currentProp) {
                    state.properties.push(currentProp);
                    currentProp = null;
                }
                state.outro = cleanMarkdown(line);
            }
        }

        // Save last property
        if (currentProp) state.properties.push(currentProp);
    }

    // Assign URLs
    let urlIdx = 0;
    for (let p of state.properties) {
        if (!p.url && urlIdx < state.urls.length) {
            const match = p.ref ? state.urls.find(u => u.includes(p.ref)) : null;
            p.url = match || state.urls[urlIdx++];
        }
    }

    if (state.properties.length === 0) return formatRegularMessage(content);

    let result = '';
    if (state.intro) result += '<div class="regular-text" style="margin-bottom:16px;font-weight:500">' + state.intro + '</div>';

    for (let p of state.properties.slice(0, 3)) {
        result += formatPropertyCard(p);
    }

    if (state.properties.length > 3) {
        result += '<div style="text-align:center;margin:20px 0"><button onclick="showMore(event)" class="show-more-btn">Show More</button></div>';
    }

    if (state.outro) result += '<div class="regular-text" style="margin-top:16px">' + state.outro + '</div>';

    return result;
}

function formatMultiLocationListing(content, lines) {
    const state = {
        intro: '',
        outro: '',
        locations: [],
        currentLocation: null,
        currentProperty: null,
        urls: []
    };

    // First pass: extract all URLs
    for (let line of lines) {
        const matches = [...line.matchAll(REGEX.markdownLink)];
        for (let m of matches) {
            const url = cleanUrl(m[2]);
            if (url.includes('ref_no=') || url.includes('/property')) state.urls.push(url);
        }
    }

    let inOutro = false;
    let propCounter = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (inOutro) { state.outro += ' ' + cleanMarkdown(line); continue; }

        // Check for intro line (before any location)
        if (!state.currentLocation && /found|here are|showing/i.test(line)) {
            state.intro = cleanMarkdown(line);
            continue;
        }

        // Check for bold text: **something**
        const boldMatch = line.match(/\\*\\*([^*]+)\\*\\*/);
        if (boldMatch) {
            const boldText = boldMatch[1].trim();

            // Is this a LOCATION heading? (short, no property keywords)
            const isLocationHeading = boldText.length < 25 &&
                !/for sale|apartment|villa|house|penthouse|townhouse|bungalow|duplex|ground floor|property for/i.test(boldText);

            if (isLocationHeading) {
                // Save current property first
                if (state.currentProperty && state.currentLocation) {
                    state.currentLocation.properties.push(state.currentProperty);
                    state.currentProperty = null;
                }
                // New location section
                state.currentLocation = { name: boldText, properties: [] };
                state.locations.push(state.currentLocation);
                propCounter = 0;
                continue;
            } else if (state.currentLocation) {
                // This is a PROPERTY TITLE
                if (state.currentProperty) {
                    state.currentLocation.properties.push(state.currentProperty);
                }
                propCounter++;
                state.currentProperty = {
                    number: propCounter,
                    title: boldText,
                    location: '', type: '', bedrooms: '', bathrooms: '',
                    buildSize: '', plotSize: '', price: '', ref: '', url: ''
                };
                continue;
            }
        }

        // Check for property data patterns (beds, baths, price, ref, etc.)
        const hasPropertyData = /beds|baths|m²|m2|Ref:|€|View Property/i.test(line);

        if (state.currentLocation && hasPropertyData) {
            // If no current property, create one
            if (!state.currentProperty) {
                propCounter++;
                state.currentProperty = {
                    number: propCounter,
                    title: 'Property ' + propCounter,
                    location: '', type: '', bedrooms: '', bathrooms: '',
                    buildSize: '', plotSize: '', price: '', ref: '', url: ''
                };
            }
            processPropertyLine(line, state.currentProperty);
            continue;
        }

        // Check for "No properties found" message
        if (state.currentLocation && /no properties found/i.test(line)) {
            state.currentLocation.noResults = true;
            continue;
        }

        // Check for outro
        if (/let me know|refine your search/i.test(line)) {
            if (state.currentProperty && state.currentLocation) {
                state.currentLocation.properties.push(state.currentProperty);
                state.currentProperty = null;
            }
            inOutro = true;
            state.outro = cleanMarkdown(line);
        }
    }

    // Save last property
    if (state.currentProperty && state.currentLocation) {
        state.currentLocation.properties.push(state.currentProperty);
    }

    // Assign URLs to properties
    let urlIdx = 0;
    for (let loc of state.locations) {
        for (let p of loc.properties) {
            if (!p.url && urlIdx < state.urls.length) {
                const match = p.ref ? state.urls.find(u => u.includes(p.ref)) : null;
                p.url = match || state.urls[urlIdx++];
            }
        }
    }

    // Build HTML output
    let result = '';

    if (state.intro) {
        result += '<div class="regular-text" style="margin-bottom:16px;font-weight:500">' + state.intro + '</div>';
    }

    for (let loc of state.locations) {
        result += '<div style="margin:20px 0 12px 0;padding:10px 16px;background:linear-gradient(135deg,' + cfg.primaryColor + ',' + cfg.secondaryColor + ');color:#fff;border-radius:8px;font-weight:600;font-size:16px">' + loc.name + '</div>';

        if (loc.noResults) {
            result += '<div class="regular-text" style="padding:12px;color:#6b7280;font-style:italic">No properties found in this location.</div>';
        } else if (loc.properties.length === 0) {
            result += '<div class="regular-text" style="padding:12px;color:#6b7280;font-style:italic">No properties available.</div>';
        } else {
            for (let p of loc.properties.slice(0, 3)) {
                result += formatPropertyCard(p);
            }
        }
    }

    const totalProps = state.locations.reduce((sum, loc) => sum + loc.properties.length, 0);
    if (totalProps > 0) {
        result += '<div style="text-align:center;margin:20px 0"><button onclick="showMore(event)" class="show-more-btn">Show More</button></div>';
    }

    if (state.outro) {
        result += '<div class="regular-text" style="margin-top:16px">' + state.outro + '</div>';
    }

    return result;
}

function processPropertyLine(line, property) {
    // Clean line but preserve content
    line = line.replace(/\\*\\*/g, '').replace(/^[-•◦]\\s*/, '').trim();

    // BEDROOMS: Look for "X beds" or "X slaapkamers" (Dutch)
    if (!property.bedrooms) {
        const m = line.match(/(\\d+)\\s*(?:beds?|slaapkamers?|dormitorios?|chambres?)/i) || line.match(/(?:bedrooms?|slaapkamers?)[:\\s]+(\\d+)/i);
        if (m) property.bedrooms = m[1];
    }

    // BATHROOMS: Look for "X baths" or "X badkamers" (Dutch)
    if (!property.bathrooms) {
        const m = line.match(/(\\d+)\\s*(?:baths?|bathrooms?|badkamers?|baños?|salles?)/i) || line.match(/(?:bathrooms?|badkamers?)[:\\s]+(\\d+)/i);
        if (m) property.bathrooms = m[1];
    }

    // BUILD SIZE: Look for "X m² build" or "X m² bebouwd" (Dutch)
    if (!property.buildSize) {
        const m = line.match(/([\\d,]+)\\s*m[²2]?\\s*(?:build|bebouwd|construido|construida)/i);
        if (m) property.buildSize = m[1].replace(/,/g, '') + ' m²';
    }

    // PLOT SIZE: Look for "X m² plot" or "X m² perceel" (Dutch)
    if (!property.plotSize) {
        const m = line.match(/([\\d,]+)\\s*m[²2]?\\s*(?:plot|perceel|terreno|parcela|terrein)/i);
        if (m) property.plotSize = m[1].replace(/,/g, '') + ' m²';
    }

    // SIZE PREFIX: "Size: X m² build | Y m² plot"
    if (line.toLowerCase().includes('size:')) {
        const content = line.substring(line.toLowerCase().indexOf('size:') + 5);
        const buildM = content.match(/([\\d,]+)\\s*m[²2]?\\s*build/i);
        const plotM = content.match(/([\\d,]+)\\s*m[²2]?\\s*plot/i);
        if (buildM && !property.buildSize) property.buildSize = buildM[1].replace(/,/g, '') + ' m²';
        if (plotM && !property.plotSize) property.plotSize = plotM[1].replace(/,/g, '') + ' m²';
    }

    // REFERENCE: Look for "Ref: XXXXX" or "RS12345"
    if (!property.ref) {
        const m = line.match(/ref[:\\s]*([A-Z]?[SR]?\\d{4,})/i) || line.match(/([SR]\\d{5,})/i);
        if (m) property.ref = m[1];
    }

    // PRICE: Look for €X,XXX,XXX or €X.XXX.XXX (European format)
    if (!property.price) {
        const m = line.match(/€\\s*([\\d.,]+)/);
        if (m) property.price = '€' + m[1];
    }

    // LOCATION: "Location: X"
    if (!property.location && line.toLowerCase().includes('location:')) {
        const m = line.match(/location[:\\s]+([^,|\\n]+)/i);
        if (m) property.location = m[1].trim();
    }
}

function formatPrice(price) {
    // Format price with thousand separators (comma style)
    if (!price) return '';
    // Remove existing formatting and currency symbol
    let num = price.replace(/[€$£\\s]/g, '').replace(/[.,]/g, '');
    if (!num || isNaN(num)) return price;
    // Format with commas as thousand separator
    let formatted = parseInt(num).toLocaleString('en-US');
    return '€' + formatted;
}

function formatPropertyCard(p) {
    let html = '<div class="property-card">';
    html += '<div class="property-title">' + p.number + '. ' + p.title + '</div>';
    html += '<div class="property-details">';

    if (p.location) html += '<div class="property-detail-row"><span class="detail-label">📍 ' + (t.propLocation || 'Location') + ':</span><span class="detail-value">' + p.location + '</span></div>';
    if (p.type) html += '<div class="property-detail-row"><span class="detail-label">🏠 ' + (t.propType || 'Type') + ':</span><span class="detail-value">' + p.type + '</span></div>';

    if (p.bedrooms || p.bathrooms) {
        let rooms = '';
        if (p.bedrooms) rooms += '🛏️ ' + p.bedrooms + ' ' + (t.propBeds || 'beds');
        if (p.bedrooms && p.bathrooms) rooms += ' | ';
        if (p.bathrooms) rooms += '🚿 ' + p.bathrooms + ' ' + (t.propBaths || 'baths');
        html += '<div class="property-detail-row"><span class="detail-value" style="color:#374151;font-weight:500">' + rooms + '</span></div>';
    }

    if (p.buildSize || p.plotSize) {
        let size = '📐 ';
        if (p.buildSize) size += p.buildSize + ' ' + (t.propBuild || 'build');
        if (p.buildSize && p.plotSize) size += ' | ';
        if (p.plotSize) size += p.plotSize + ' ' + (t.propPlot || 'plot');
        html += '<div class="property-detail-row"><span class="detail-value" style="color:#374151;font-weight:500">' + size + '</span></div>';
    }

    if (p.ref) html += '<div class="property-detail-row"><span class="detail-label">🔑 Ref:</span><span class="detail-value">' + p.ref + '</span></div>';
    html += '</div>';

    if (p.price) html += '<div class="property-price">💰 ' + formatPrice(p.price) + '</div>';
    if (p.url) html += '<a href="' + p.url + '" target="_blank" class="property-link"><span>🔗</span><span>' + t.viewPropertyButton + '</span></a>';

    html += '</div>';
    return html;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || isTyping || chatEnded) return;

    isTyping = true;
    addMessage('user', message);
    input.value = '';

    document.getElementById('typing').classList.add('active');
    setLoading(true, t.typingIndicator);

    try {
        const response = await parent.sendToBackend({
            action: 'sendMessage',
            sessionId: parent.sessionId,
            chatInput: message,
            name: userInfo?.name || 'Guest',
            email: userInfo?.email || '',
            phone: userInfo?.phone || ''
        });

        const botMsg = response.text || response.output || response.message || response.response || 'Message received.';
        addMessage('bot', botMsg);

    } catch (error) {
        addMessage('bot', t.connectionError);
    }

    document.getElementById('typing').classList.remove('active');
    setLoading(false);
    isTyping = false;
    input.focus();
}

async function showMore(event) {
    const btn = event?.target;
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Loading...';
    }

    const input = document.getElementById('chatInput');
    const orig = input.value;
    input.value = 'Show more';
    await sendMessage();
    input.value = orig;
}
</script>
</body></html>`;
        }

        attachEventListeners() {
            this.toggleButton.addEventListener('click', () => this.toggleChat());

            window.closeWidget = () => this.closeChat();
            window.sessionId = this.sessionId;
            window.StorageManager = StorageManager;
            window.sendToBackend = (data) => this.sendToN8N(data);
            window.createNewSession = () => this.createNewSession();
        }

        createNewSession() {
            StorageManager.clearState();
            this.sessionId = 'rs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            try { localStorage.setItem(StorageManager.keys.sessionId, this.sessionId); } catch (e) {}
            window.sessionId = this.sessionId;
        }

        toggleChat() { this.state.isOpen ? this.closeChat() : this.openChat(); }

        openChat() {
            if (!this.iframe) this.createIframe();
            this.state.isOpen = true;
            this.iframe.style.display = 'block';
        }

        closeChat() {
            if (this.iframe) this.iframe.style.display = 'none';
            this.state.isOpen = false;
        }

        async sendToN8N(data) {
            try {
                const response = await fetch(this.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        language: this.currentLanguage,
                        ...data
                    })
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const text = await response.text();
                try { return JSON.parse(text); } catch (e) { return { text }; }
            } catch (error) {
                throw error;
            }
        }

        open() { this.openChat(); }
        close() { this.closeChat(); }
        destroy() {
            document.getElementById('realty-container')?.remove();
            this.iframe?.remove();
            document.getElementById('realty-styles')?.remove();
        }
    }

    window.initRealtySoftEmbed = function(config) {
        try {
            console.log('RealtySoft: Initializing widget...');
            const widget = new RealtySoftWidget(config);
            window.realtySoftWidget = widget;
            console.log('RealtySoft: Widget created successfully');
            return widget;
        } catch (error) {
            console.error('RealtySoft: Widget creation failed', error);
            return null;
        }
    };

    // ============================================
    // VERSION UTILITIES - For debugging and cache management
    // ============================================
    window.RealtySoftVersion = {
        version: VERSION,
        timestamp: VERSION_TIMESTAMP,

        // Check current loaded version
        check: function() {
            console.log('RealtySoft Widget v' + VERSION);
            console.log('Build: ' + VERSION_TIMESTAMP);
            console.log('Loaded: ' + (window._realtySoftLoaded || 'unknown'));
            return { version: VERSION, timestamp: VERSION_TIMESTAMP };
        },

        // Force reload the widget script (for manual cache bust)
        forceReload: function() {
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src && scripts[i].src.includes('chatbot')) {
                    const src = scripts[i].src.split('?')[0];
                    const newScript = document.createElement('script');
                    newScript.src = src + '?v=' + Date.now();
                    scripts[i].parentNode.removeChild(scripts[i]);
                    document.head.appendChild(newScript);
                    console.log('Reloading chatbot.js...');
                    return true;
                }
            }
            return false;
        },

        // Clear widget cache (localStorage)
        clearCache: function() {
            try {
                localStorage.removeItem('realty_state');
                localStorage.removeItem('realty_session_id');
                console.log('Widget cache cleared');
                return true;
            } catch (e) {
                return false;
            }
        }
    };

    // Log version on load (helpful for debugging)
    console.log('RealtySoft Widget v' + VERSION + ' (' + VERSION_TIMESTAMP + ') loaded');

    // Process any queued configs from loader
    if (window._realtySoftQueue && window._realtySoftQueue.length > 0) {
        console.log('RealtySoft: Processing ' + window._realtySoftQueue.length + ' queued config(s)');
        var queue = window._realtySoftQueue.slice(); // Copy array
        window._realtySoftQueue = []; // Clear original
        for (var i = 0; i < queue.length; i++) {
            try {
                window.initRealtySoftEmbed(queue[i]);
            } catch (e) {
                console.error('RealtySoft: Failed to init from queue', e);
            }
        }
    }
})();
