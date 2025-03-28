/**
 * This file is part of the MDXCalculator project https://github.com/bobboteck/MDXCalculator
 */
let qsoData = [];
let rulesConfig = {};
let dxccEntities = [];

init();

async function init()
{
    // Read rules config file
    rulesConfig = await ReadRulesConfig();
    // Read dxcc entity file
    dxccEntities = await ReadDxccEntities();
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
        ShowMessage("No file selected. Please choose a file.", "danger");
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
        ShowMessage("Errore leggendo il file, riprovare.", "danger");
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
        ShowMessage("Non sono definite regole per l'anno " + yearSelect.value, "warning");
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
    let hasDxccError = false;
    let hasDxccNotFound = false;

    document.getElementById("btnElabora").disabled = true;

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
                        country: "ITALY",
                        dxcc: new Number(qso.dxcc),
                        cqZone: qso.cqz,
                        scoreType: 0
                    };

                    maratonQso.push(qsoToAdd);
                    isAddedIq0rm = true;

                    document.getElementById("iq0rmScore").innerText = "Yes";
                }
            }
            else
            {
                let currentQsoCountry = "";
                if(qso.country !== undefined)
                {
                    currentQsoCountry = qso.country;
                }
                else
                {
                    if(qso.dxcc !== undefined)
                    {
                        // Find the DXCC into the list
                        const dxccEntity = dxccEntities.find(d=>d.entityCode === parseInt(qso.dxcc));
                        // Check if has find the DXCC into the list
                        if(dxccEntity !== undefined)
                        {
                            currentQsoCountry = dxccEntity.entityName;
                        }
                        else
                        {
                            console.log("QSO DXCC Country not found into list: ", qso.dxcc);
                            hasDxccNotFound = true;
                        }
                    }
                    else
                    {
                        console.log("QSO no DXCC Country info: ", qso);
                        hasDxccError = true;
                    }
                }

                // Check if maratonQso contains country or dxcc, if not add it
                const isCountryExist = maratonQso.some(q => q.country === currentQsoCountry && q.scoreType === 1);
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
                        country: currentQsoCountry,
                        dxcc: new Number(qso.dxcc),
                        cqZone: qso.cqz,
                        scoreType: 1
                    };

                    maratonQso.push(qsoToAdd);
                    // Update counter
                    qsoNumberCountry++;
                    document.getElementById("contryScore").innerText = qsoNumberCountry;
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
                            country: currentQsoCountry,
                            dxcc: new Number(qso.dxcc),
                            cqZone: qso.cqz,
                            scoreType: 2
                        };

                        maratonQso.push(qsoToAdd);
                        // Update counter
                        qsoNumberCqZone++;
                        document.getElementById("cqZoneScore").innerText = qsoNumberCqZone;
                    }
                }
            }

            qsoNumberTotal++;
        }
    });

    maratonQso.forEach(qso =>
    {
        AddQsoToTable(qso);
    });

    if(hasDxccError)
    {
        ShowMessage("Si è verificato uno o più errori nell'elaborazione dei dati DXCC del ADIF!", "danger");
    }

    if(hasDxccNotFound)
    {
        ShowMessage("Uno o più DXCC indicati nel file ADIF non sono stati trovati nella lista dei DXCC!", "danger");
    }

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
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
    let messageIcon = "";

    switch (type)
    {
        case "warning":
            messageIcon = "bi-exclamation-diamond-fill";
            break;
        case "danger":
            messageIcon = "bi-exclamation-triangle-fill";
            break;
        case "success":
            messageIcon = "bi-check-circle-fill";
            break;
        default:
            messageIcon = "bi-info-circle-fill";
            break;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `<div style="float: left; padding-right:15px"><i class="bi ${messageIcon} flex-shrink-0 me-2"></i></div>`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');

    alertPlaceholder.append(wrapper);
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
 */
function AddQsoToTable(qsoInfo)
{
    // Get Table tbody for add QSO data
    var tableTbody = document.getElementById("tableQso").getElementsByTagName('tbody')[0];
    // Create a new row (tr)
    var newRow = document.createElement("tr");
    // Create cells (td) for row
    // Day
    var cellDay = document.createElement("td");
    cellDay.textContent = qsoInfo.day;
    // Month
    var cellMonth = document.createElement("td");
    cellMonth.textContent = qsoInfo.mounth;
    // Time
    var cellTime = document.createElement("td");
    cellTime.textContent = qsoInfo.time;
    // Frequency
    var cellFrequency = document.createElement("td");
    cellFrequency.textContent = qsoInfo.frequency;
    // Mode
    var cellMode = document.createElement("td");
    cellMode.textContent = qsoInfo.mode;
    // Call
    var cellCall = document.createElement("td");
    if(qsoInfo.scoreType === 0)
    {
        cellCall.innerHTML = "<div style='background-color:#198754;color:#fff;border-radius:5px;padding-left:5px'>" + qsoInfo.callSign + "</div>"
    }
    else
    {
        cellCall.textContent = qsoInfo.callSign;
    }
    // Country
    var cellCountry = document.createElement("td");
    if(qsoInfo.scoreType === 1)
    {
        cellCountry.innerHTML = "<div style='background-color:#198754;color:#fff;border-radius:5px;padding-left:5px'>" + qsoInfo.country + "</div>"
    }
    else
    {
        cellCountry.textContent = qsoInfo.country;
    }
    // CQ Zone
    var cellCqZone = document.createElement("td");
    if(qsoInfo.scoreType === 2)
    {
        cellCqZone.innerHTML = "<div style='background-color:#198754;color:#fff;border-radius:5px;padding-left:5px'>" + qsoInfo.cqZone + "</div>"
    }
    else
    {
        cellCqZone.textContent = qsoInfo.cqZone;
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

/**
 * Read rules from json file
 * @returns 
 */
async function ReadRulesConfig()
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

/**
 * Read dxcc entities from json file
 * @returns 
 */
async function ReadDxccEntities()
{
    if(window.location.protocol === "file:")
    {
        return Promise.resolve(
        [
            {
                "entityCode": 0,
                "entityName": "None",
                "deleted": false
            },
            {
                "entityCode": 63,
                "entityName": "FRENCH GUIANA",
                "deleted": false
            },
            {
                "entityCode": 248,
                "entityName": "ITALY",
                "deleted": false
            },
            {
                "entityCode": 227,
                "entityName": "FRANCE",
                "deleted": false
            },
            {
                "entityCode": 291,
                "entityName": "UNITED STATES OF AMERICA",
                "deleted": false
            }
        ]);
    }
    else
    {
        return fetch("./js/dxcc.json")
        .then(response => 
        {
            if (!response.ok)
            {
                ShowMessage("Impossibile caricare il file con la lista DXCC", "danger");
            }
            else
            {
                return response.json();
            }
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