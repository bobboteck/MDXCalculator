import 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js';

CookieConsent.run({
    // your config. goes here (required)
    "palette": 
        {
            "popup":
            {
                "background": "#000"
            },
            "button":
            {
                "background": "#f1d600",
                "text": "#000"
            }
        },
        "theme": "classic",
        "position": "bottom-right",
        "content": 
        {
            "message": "Questo sito utilizza cookie per offrirti la migliore esperienza. Per continuare, accetta l'uso dei cookie.",
            "dismiss": "Accetta",
            "link": "Leggi di più",
            "href": "https://bobboteck.github.io/terms/"
        },
        "onStatusChange": function(status)
        {
            if (status === 'allow') 
            {
                // Se l'utente accetta i cookie, carica Google Analytics
                loadGoogleAnalytics();
            }
            else
            {
                // Se l'utente rifiuta, non caricare Google Analytics
                console.log("Google Analytics disabilitato.");
            }
        }
});


// Funzione per caricare Google Analytics
function loadGoogleAnalytics()
{
    // var script = document.createElement('script');
    // script.src = "https://www.googletagmanager.com/gtag/js?id=G-S9VGT9VX9Y";
    // script.async = true;
    // script.onload = function()
    // {
    //     window.dataLayer = window.dataLayer || [];
    //     function gtag() 
    //     {
    //         dataLayer.push(arguments);
    //     }
    //     gtag('js', new Date());

    //     gtag('config', 'G-S9VGT9VX9Y');
    // };
    // document.head.appendChild(script);

    console.log("abilita GA");
}
