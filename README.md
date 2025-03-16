# MDXAriRmCalculator

La **Maratona DX** ha lo scopo di promuovere l’attività DX dei Soci della [Sezione ARI di Roma](https://www.ariroma.it/wp/) durante tutto l’anno.

Questa applicazione permette di semplificare il calcolo dei punteggi partendo da un file [ADIF](https://adif.org/), l'obbiettivo finale è quello di generare un elenco dei collegamenti utili alla partecipazione della Maratona, al fine di semplificare la compilazione del modulo di participazione.

L'applicazione funziona completamente sul client, tramite codice Javascript, nessun dato del file ADIF viene caricato sul server, ne quatomeno i dati elaborati e i punteggi.
Tutto il codice è Open Source e rilasciato con licenza MIT, ed è disponibile in questo repository.
Eventuali segnalazioni per BUG o miglioramenti, possono essere fatte usando la sezione [Issues](https://github.com/bobboteck/MDXCalculator/issues).

## Librerie

Per la grafica ho utilizzato Bootstrap 5.
Per il parsing del file ADIF ho utilizzato la libreria di **[Stephen Houser - N1SH](https://www.qrz.com/db/N1SH)**</b></a>** presente nel suo progetto [QSO Mapper](https://github.com/stephenhouser/qso-mapper).
