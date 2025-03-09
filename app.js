/**
 * Speech Module - Handles all speech-related functionality
 * Uses IIFE pattern to create a private scope
 */
const SpeechModule = (() => {
    // Private variable to store the user's name
    let userName = null;

    /**
     * Speaks the given text using Web Speech API
     * @param {string} text - The text to be spoken
     */
    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;  // Slightly slower speech rate
        utterance.volume = 1;   // Full volume
        utterance.pitch = 1;    // Normal pitch
        window.speechSynthesis.speak(utterance);
    };

    /**
     * Sets the user's name (only if not already set)
     * @param {string} name - The user's name
     */
    const setUserName = (name) => {
        if (!userName) {  // Ensure immutability
            userName = name;
        }
    };

    /**
     * Gets the user's name, returns 'User' as default if not set
     * @returns {string} - The user's name
     */
    const getUserName = () => {
        return userName || 'User';  // Default fallback
    };

    /**
     * Greets the user based on the current time
     */
    const wishMe = () => {
        const hour = new Date().getHours();
        if (hour < 12) speak(`Good Morning ${getUserName()}`);
        else if (hour < 17) speak(`Good Afternoon ${getUserName()}`);
        else speak(`Good Evening ${getUserName()}`);
    };

    // Public API
    return { speak, wishMe, setUserName, getUserName };
})();

// Recognition Module
const RecognitionModule = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    const init = () => {
        if (!SpeechRecognition) {
            console.error('SpeechRecognition API not supported');
            alert('SpeechRecognition API not supported');
            return null;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => console.log('Voice recognition activated');
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            SpeechModule.speak("Sorry, I didn't catch that. Could you please repeat?");
        };
        recognition.onend = () => {
            console.log('Voice recognition turned off');
            document.querySelector('.content').textContent = "Click the button to start listening again";
        };

        return recognition;
    };

    return { init };
})();

/**
 * Command Processor - Handles all recognized commands
 */
const CommandProcessor = {
    /**
     * Processes the recognized message and executes corresponding action
     * @param {string} message - The recognized speech text
     */
    process: (message) => {
        const lowerMessage = message.toLowerCase();
        
        // Command-action mapping
        const actions = {
            'go to sleep': () => {
                SpeechModule.speak(`Sure ${SpeechModule.getUserName()}, going to sleep now!`);
                document.querySelector('.content').textContent = "Stopped listening.";
                recognition.stop();
            },
            'stop listening': () => {
                SpeechModule.speak("Stopping voice recognition");
                document.querySelector('.content').textContent = "Stopped listening.";
                recognition.stop();
            },
            'hey|hello': () => SpeechModule.speak("Hello Sir, How May I Help You?"),
            'open google': () => openUrl('https://google.com', "Opening Google..."),
            'open youtube': () => openUrl('https://youtube.com', "Opening Youtube..."),
            'open facebook': () => openUrl('https://facebook.com', "Opening Facebook..."),
            'what is|who is|what are': () => searchGoogle(message, "This is what I found on the internet regarding "),
            'wikipedia': () => searchWikipedia(message),
            'time': () => speakTime(),
            'date': () => speakDate(),
            'day': () => speakDay(),
            'calculator': () => openCalculator(),
            default: () => searchGoogle(message, "I found some information for ")
        };

        // Find and execute the matching action
        const actionKey = Object.keys(actions).find(key => new RegExp(key).test(lowerMessage));
        (actions[actionKey] || actions.default)();
    }
};

// Helper Functions
const openUrl = (url, message) => {
    window.open(url, "_blank");
    SpeechModule.speak(message);
};

const searchGoogle = (query, message) => {
    window.open(`https://www.google.com/search?q=${query.replace(" ", "+")}`, "_blank");
    SpeechModule.speak(message + query);
};

const searchWikipedia = (query) => {
    window.open(`https://en.wikipedia.org/wiki/${query.replace("wikipedia", "").trim()}`, "_blank");
    SpeechModule.speak("This is what I found on Wikipedia regarding " + query);
};

const speakTime = () => {
    const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
    SpeechModule.speak("The current time is " + time);
};

const speakDate = () => {
    const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
    SpeechModule.speak("Today's date is " + date);
};

const speakDay = () => {
    const day = new Date().toLocaleString(undefined, { weekday: 'long' });
    SpeechModule.speak("Today is " + day);
};

const openCalculator = () => {
    window.open('Calculator:///');
    SpeechModule.speak("Opening Calculator");
};

/**
 * Initialization - Runs when the window loads
 */
window.addEventListener('load', () => {
    SpeechModule.speak("Initializing...");
    
    // Delay initial greeting to allow for proper initialization
    setTimeout(() => {
        SpeechModule.speak("I'm Yobot, your cutting-edge AI companion! What should I call you?");
        
        const recognition = RecognitionModule.init();
        if (recognition) {
            /**
             * Handles speech recognition results
             */
            recognition.onresult = (event) => {
                const transcript = event.results[event.resultIndex][0].transcript.trim();
                
                // If username isn't set, capture it
                if (!SpeechModule.getUserName() || SpeechModule.getUserName() === 'User') {
                    SpeechModule.setUserName(transcript);
                    SpeechModule.speak(`Nice to meet you, ${transcript}!`);
                    SpeechModule.wishMe();
                    document.querySelector('.content').textContent = `Listening to ${transcript}...`;
                    return;
                }
                
                // Process recognized speech
                document.querySelector('.content').textContent = transcript;
                CommandProcessor.process(transcript);
            };

            document.querySelector('.talk').addEventListener('click', () => {
                document.querySelector('.content').textContent = "Listening...";
                recognition.start();
            });

            document.querySelector('.stop').addEventListener('click', () => {
                recognition.stop();
                document.querySelector('.content').textContent = "Stopped listening.";
                SpeechModule.speak("Stopping listening.");
            });
        }
    }, 2000);  // 2-second delay for initialization
});

// Add this code to handle the help button and dropdowns
document.addEventListener('DOMContentLoaded', function() {
    // Help button functionality
    const helpButton = document.querySelector('.help-button');
    const helpDialog = document.getElementById('helpDialog');

    helpButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        helpDialog.style.display = helpDialog.style.display === 'block' ? 'none' : 'block';
    });

    // Close dialog when clicking outside
    document.addEventListener('click', function(e) {
        if (!helpDialog.contains(e.target) && e.target !== helpButton) {
            helpDialog.style.display = 'none';
        }
    });

    // Dropdown functionality
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const menuItem = this.parentElement;
            menuItem.classList.toggle('active');
        });
    });
});

// To show loader
document.querySelector('.loader').style.display = 'flex';

// Hide loader after 3 seconds (for testing)
setTimeout(() => {
    document.querySelector('.loader').style.display = 'none';
}, 3000);

// Add this JavaScript to handle lazy loading
document.addEventListener("DOMContentLoaded", function() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        imageObserver.observe(img);
    });
});

// Add this JavaScript to handle the loader transition
document.addEventListener("DOMContentLoaded", function() {
    const loader = document.querySelector('.loader');
    const appContent = document.querySelector('.app-content');
    const mainSection = document.querySelector('.main');

    // Show the main section immediately
    mainSection.style.display = 'flex';

    // Simulate loading process (replace with actual loading logic)
    setTimeout(() => {
        // Hide loader
        loader.style.display = 'none';
        
        // Show app content with fade-in effect
        appContent.style.display = 'block';
        setTimeout(() => {
            appContent.style.opacity = 1;
        }, 10);
    }, 3000); // 3 seconds delay for demonstration
});