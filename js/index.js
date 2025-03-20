/**
 * This file is part of the MDXCalculator project https://github.com/bobboteck/MDXCalculator
 */
let qsoData = [];
let rulesConfig = {};

init();

async function init()
{
    rulesConfig = await GetRulesConfig();
    // Add Events listener
    document.getElementById("fileInput").addEventListener("change", onChangeFileSelection);
    document.getElementById("yearSelect").addEventListener("change", onChangeYearSelect);
    document.getElementById("modeSelect").addEventListener("change", onChangeModeSelect);
    document.getElementById("btnElabora").addEventListener("click", onClickElabora);
}

/*******************
 * Event functions *
 *******************/

/**
 * Read and parse ADIF file when selected
 * @param {*} event 
 * @returns 
 */
function onChangeFileSelection(event)
{
    const file = event.target.files[0];
    // Validate file existence and type
    if(!file)
    {
        ShowMessage("No file selected. Please choose a file.", "error");
        return;
    }

    console.log("file.type: ", file.type);

    // Read the file
    const reader = new FileReader();
    reader.onload = () =>
    {
        // Parse ADIF file
        let [header, loadedQsos] = Adif.parseAdif(reader.result);
        console.log(header);

        if(loadedQsos.length > 0)
        {
            ShowQsoReaded(loadedQsos.length);
            GetQsoYear(loadedQsos);
            qsoData = loadedQsos;

            document.getElementById("yearSelect").disabled = false;
        }
        else
        {
            ShowMessage("Il file selezionato non contiene QSO", "warning");
        }
    };

    reader.onerror = () =>
    {
        ShowMessage("Errore leggendo il file, riprovare.", "error");
    };
  
    reader.readAsText(file);
}

function onChangeYearSelect(event)
{
    const yearSelect = document.getElementById('yearSelect');
    const modeSelect = document.getElementById("modeSelect");

    // Reset select element
    modeSelect.length = 1;

    // Find rules for the selected year
    const yearRule = rulesConfig.years.find(item=>item.year === yearSelect.value);
    const rules = yearRule ? yearRule.rules : [];
    // If rules is present for that year
    if(rules.length > 0)
    {
        rules.forEach(rule => 
        {
            // Add e new option element for each year into the array
            const option = document.createElement('option');
            option.value = rule.value;
            option.textContent = rule.label;
            modeSelect.appendChild(option);
        });

        // Enable the dropdown to the selection of Maratone Rule mode
        modeSelect.disabled = false;
    }
    else
    {
        ShowMessage("Non sono definite regole per l'anno " + yearSelect.value, "alert");
        // Enable the dropdown to the selection of Maratone Rule mode
        modeSelect.disabled = true;
    }
}

function onChangeModeSelect(event)
{
    document.getElementById("btnElabora").disabled = false;
}

/***********
 * Utiltiy *
 ***********/

/**
 * Determines which QSOs should be used for scoring purposes
 */
function onClickElabora()
{
    //{ day: "01", mounth: "01", time: "09.22", frequency: 14.328, mode: "ssb", callSign: "IU0PHY", country: "Italy", dxcc: 123, cqZone: 14, scoreType: 1} //scoreType: 0-IQ0RM, 1-Country, 2-CQZone
    let maratonQso = [];
    let qsoNumberTotal = 0;
    let qsoNumberCountry = 0;
    let qsoNumberCqZone = 0;
    let isAddedIq0rm = false;

    RemoveAllQsoFromTable();
    ResetScoreBox();

    const selectedYear = document.getElementById("yearSelect").value;
    const selectedMode = document.getElementById("modeSelect").value;

    qsoData.forEach(qso =>
    {
        // Elabora solo i QSO dell'anno slezionato, dei modi corrispondenti alla selezione del regolamento e di frequenza inferiore ai 51MHz
        if(qso.qso_date.substring(0, 4) === selectedYear && selectedMode.includes(qso.mode) && qso.freq < 51)
        {
            // Check if current call is IQ0RM
            if(qso.call.toUpperCase() === "IQ0RM")
            {
                // Check if IQ0RM is just added or not
                if(!isAddedIq0rm)
                {
                    let qsoToAdd = {
                        day: qso.qso_date.substring(6, 8),
                        mounth: qso.qso_date.substring(4, 6),
                        time: qso.time_on.substring(0, 2) + "." + qso.time_on.substring(2, 4),
                        frequency: qso.freq,
                        mode: qso.mode,
                        callSign: qso.call,
                        country: qso.country,
                        dxcc: 123,
                        cqZone: qso.cqz,
                        scoreType: 0
                    };

                    maratonQso.push(qsoToAdd);
                    isAddedIq0rm = true;

                    document.getElementById("iq0rmScore").innerText = "Yes";
                    // Add qso to talbe
                    AddQsoToTable(qso, 0);
                }
            }
            else
            {
                // Check if maratonQso contains country or dxcc(TODO:...), if not add it
                const isCountryExist = maratonQso.some(q => q.country === qso.country && q.scoreType === 1);
                // If not contains this Country add it, otherwise check if contains CQZone
                if(!isCountryExist)
                {
                    let qsoToAdd = {
                        day: qso.qso_date.substring(6, 8),
                        mounth: qso.qso_date.substring(4, 6),
                        time: qso.time_on.substring(0, 2) + "." + qso.time_on.substring(2, 4),
                        frequency: qso.freq,
                        mode: qso.mode,
                        callSign: qso.call,
                        country: qso.country,
                        dxcc: 123,
                        cqZone: qso.cqz,
                        scoreType: 1
                    };

                    maratonQso.push(qsoToAdd);
                    // Update counter
                    qsoNumberCountry++;
                    document.getElementById("contryScore").innerText = qsoNumberCountry;
                    // Add qso to talbe
                    AddQsoToTable(qso, 1);
                }
                else
                {
                    // If QSO is not used for the country check if maratonQso contains CQZone
                    const isCqZoneExist = maratonQso.some(q => q.cqZone === qso.cqz && q.scoreType === 2);
                    // If is not present add it
                    if(!isCqZoneExist)
                    {
                        let qsoToAdd = {
                            day: qso.qso_date.substring(6, 8),
                            mounth: qso.qso_date.substring(4, 6),
                            time: qso.time_on.substring(0, 2) + "." + qso.time_on.substring(2, 4),
                            frequency: qso.freq,
                            mode: qso.mode,
                            callSign: qso.call,
                            country: qso.country,
                            dxcc: 123,
                            cqZone: qso.cqz,
                            scoreType: 2
                        };

                        maratonQso.push(qsoToAdd);
                        // Update counter
                        qsoNumberCqZone++;
                        document.getElementById("cqZoneScore").innerText = qsoNumberCqZone;
                        // Add qso to tale
                        AddQsoToTable(qso, 2);
                    }
                }
            }

            qsoNumberTotal++;
        }
    });

    document.getElementById("btnElabora").disabled = true;

    console.log("qsoNumberTotal:  ", qsoNumberTotal);
    console.log("qsoNumberCountry:  ", qsoNumberCountry);
    console.log("qsoNumberCqZone:  ", qsoNumberCqZone);
    console.log("maratonQso: ", maratonQso);
}

/**
 * Displays a message to the user
 * @param {*} message 
 * @param {*} type 
 */
function ShowMessage(message, type)
{
    //TODO: Change alert with toast
    alert(message);
}

/**
 * Show number of QSO presents into the ADIF file
 * @param {*} qsoNumber 
 */
function ShowQsoReaded(qsoNumber)
{
    const adiFileCounter = document.getElementById("adiFileCounter");
    adiFileCounter.innerText = "Il file selezionato contiene: " + qsoNumber + " QSO";
}

/**
 * Retrieves the list of years in which the qsos present in the file were made
 * @param {*} qsos 
 */
function GetQsoYear(qsos)
{
    const years = [];

    qsos.forEach(element => 
    {
        // Extract the first 4 characters from the date (year)
        const year = element.qso_date.substring(0, 4);
    
        // Add the year to the array only if it is not already present
        if (!years.includes(year))
        {
            years.push(year);
        }
    });

    console.log(years);

    const yearSelect = document.getElementById('yearSelect');

    years.forEach(year => 
    {
        // Add e new option element for each year into the array
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

/**
 * Add a QSO to the table
 * @param {*} qsoInfo 
 * @param {*} scoreType 
 */
function AddQsoToTable(qsoInfo, scoreType)
{
    // Get Table tbody for add QSO data
    var tableTbody = document.getElementById("tableQso").getElementsByTagName('tbody')[0];
    // Create a new row (tr)
    var newRow = document.createElement("tr");
    // Create cells (td) for row
    // Day
    var cellDay = document.createElement("td");
    cellDay.textContent = qsoInfo.qso_date.substring(6, 8);
    // Month
    var cellMonth = document.createElement("td");
    cellMonth.textContent = qsoInfo.qso_date.substring(4, 6);
    // Time
    var cellTime = document.createElement("td");
    cellTime.textContent = qsoInfo.time_on.substring(0, 2) + "." + qsoInfo.time_on.substring(2, 4);
    // Frequency
    var cellFrequency = document.createElement("td");
    cellFrequency.textContent = qsoInfo.freq;
    // Mode
    var cellMode = document.createElement("td");
    cellMode.textContent = qsoInfo.mode;
    // Call
    var cellCall = document.createElement("td");
    if(scoreType === 0 && qsoInfo.call.toUpperCase() === "IQ0RM")
    {
        cellCall.innerHTML = "<div style='background-color:#198754;color:#fff;border-radius:5px;padding-left:5px'>" + qsoInfo.call + "</div>"
    }
    else
    {
        cellCall.textContent = qsoInfo.call;
    }
    // Country
    var cellCountry = document.createElement("td");
    let country = "";
    if(qsoInfo.country === undefined && qsoInfo.country === "")
    {
        country = qsoInfo.dxcc;
    }
    else
    {
        country = qsoInfo.country;
    }

    if(scoreType === 1)
    {
        cellCountry.innerHTML = "<div style='background-color:#198754;color:#fff;border-radius:5px;padding-left:5px'>" + country + "</div>"
    }
    else
    {
        cellCountry.textContent = country;
    }
    // CQ Zone
    var cellCqZone = document.createElement("td");
    if(scoreType === 2)
    {
        cellCqZone.innerHTML = "<div style='background-color:#198754;color:#fff;border-radius:5px;padding-left:5px'>" + qsoInfo.cqz + "</div>"
    }
    else
    {
        cellCqZone.textContent = qsoInfo.cqz;
    }

    // Add the cells to the row
    newRow.appendChild(cellDay);
    newRow.appendChild(cellMonth);
    newRow.appendChild(cellTime);
    newRow.appendChild(cellFrequency);
    newRow.appendChild(cellMode);
    newRow.appendChild(cellCall);
    newRow.appendChild(cellCountry);
    newRow.appendChild(cellCqZone);

    // Add the row to the tbody
    tableTbody.appendChild(newRow);
}

/**
 * Remove all QSO from the table
 */
function RemoveAllQsoFromTable()
{
    // Get table
    var tabel = document.getElementById("tableQso").getElementsByTagName('tbody')[0];
    // Remove all row from tbody
    while (tabel.rows.length > 0)
    {
        tabel.deleteRow(0);
    }
}

/**
 * Reset value of score box
 */
function ResetScoreBox()
{
    document.getElementById("contryScore").innerText = "--";
    document.getElementById("cqZoneScore").innerText = "--";
    document.getElementById("iq0rmScore").innerText = "No";
}

async function GetRulesConfig()
{
    if(window.location.protocol === "file:")
    {
        return Promise.resolve(
        {
            "years": 
            [
                {
                    "year": "2024",
                    "rules":
                    [
                        {
                            "label": "--SSB CW--",
                            "value": "SSB, USB, LSB, CW"
                        },
                        {
                            "label": "--Digitali--",
                            "value": "RTTY, PSK, FT8, FT4, JT64, JT9"
                        }
                    ]
                    
                }
            ]
        });
    }
    else
    {
        return fetch("./js/rules.json")
        .then(response => 
        {
            if (!response.ok)
            {
                throw new Error('Impossibile caricare il file JSON');
            }

            return response.json();
        })
        .then(jsonData =>
        {
            return Promise.resolve(jsonData);
        })
        .catch(error => 
        {
            console.error('Errore:', error);
        });
    }
}