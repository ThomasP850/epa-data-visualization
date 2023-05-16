import './App.css';

import { useState, useEffect } from 'react';
// import {Helmet} from 'react-helmet';

const minEmissions = 0;
const maxEmissions = 5000000;
const heatMapRadius = 25;
const maxZoom = 18;

const initialLatitude = -95.7192;
const initialLongitude = 40;
const defaultZoom = 4;

const Sectors = {
  PowerPlants: 1,
  AdipicAcidProduction: 2,
  AluminumProduction: 3,
  AmmoniaManufacturing: 4,
  CementProduction: 5,
  FerroalloyProduction: 6,
  GlassProduction: 7,
  Hcfc22: 8,
  HydrogenProduction: 9,
  IronAndSteelProduction: 10,
  LeadProduction: 11,
  LimeManufacturing: 12,
  NitricAcidProduction: 13,
  PetrochemicalProduction: 14,
  PetroleumRefineries: 15,
  PhosphoricAcidProduction: 16,
  PulpAndPaper: 17,
  SiliconCarbideProduction: 18,
  SodaAshManufacturing: 19,
  TitaniumDioxideProduction: 20,
  ZincProduction: 21,
  MunicipalLandfills: 22,
  FoodProcessing: 24,
  EthanolProduction: 25,
  Manufacturing: 26,
  Other: 27,
  Military: 28,
  Universities: 29,
  OtherChemicals: 34,
  OtherMetals: 35,
  OtherMinerals: 36,
  OtherPaperProducers: 37,
  NaturalGasDistribution: 50,
  NaturalGasLiquidsFractionation: 51,
  OffshorePetroleumAndNaturalGasProduction: 52,
  OnshorePetroleumAndNaturalGasProdction: 53,
  NaturalGasProcessing: 54,
  NaturalGasTransmissionAndCompression: 55,
  NaturalGasLocalDistribution: 56,
  UndergroundNaturalGasStorage: 58,
  FluorinatedGhgProduction: 60,
  UndergroundCoalMines: 61,
  ElectricalEquipment: 62,
  ElectronicsManufacturing: 63,
  ElectricalEquipmentManufacturing: 64,
  MagnesiumProduction: 65,
  IndustrialLandfills: 66,
  WastewaterTreatment: 67,
  SolidWasteCombustion: 68,
}

function addLibrary(url, onLoad) {
  // console.log("Adding library: [" + url + "]");

  const script = document.createElement("script");
  script.src = url;
  script.async = true;
  document.head.appendChild(script);

  if(onLoad) {
    script.onload = onLoad;
  }
}

function addLibrariesInOrder(urlList, onLoad) {
  if(urlList.length < 1) {
    return;
  } else if(urlList.length === 1) {
    addLibrary(urlList.pop(), onLoad);
  } else {
    addLibrary(urlList.shift(), () => addLibrariesInOrder(urlList, onLoad));
  }
}

function clearPastMaps() {
  const pastMap = document.getElementById("map");
  if(pastMap) {
    pastMap.remove();
  }

  const newMap = document.createElement("div");
  newMap.id = "map";
  document.getElementById("content").insertAdjacentElement("beforeend", newMap);
}

function App() {
  const mapConfig = {
    "radius": heatMapRadius,
    "useLocalExtrema": false,
    latField: "latitude",
    lngField: "longitude",
    valueField: "co2e_emission"
  };
  

  
  
  const [emissionSector, setEmissionSector] = useState(Sectors.PowerPlants);
  
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState([false]);
  const [error, setError] = useState(null);

  const [heatmapLayer, setHeatmapLayer] = useState(null);

  var baseLayer, leafletMap;

  useEffect(()  => {
    addLibrariesInOrder([
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/leaflet.js",
      "https://cdnjs.cloudflare.com/ajax/libs/heatmap.js/2.0.0/heatmap.min.js",
      "https://cdn.jsdelivr.net/npm/leaflet-heatmap@1.0.0/leaflet-heatmap.min.js"
    ], () => {
      baseLayer = window.L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '...',
          maxZoom: maxZoom
      });

      let layer = new window.HeatmapOverlay(mapConfig);
      setHeatmapLayer(layer);
  
      clearPastMaps();
      leafletMap = new window.L.Map("map", {
        center: new window.L.LatLng(initialLongitude, initialLatitude),
        zoom: defaultZoom,
        layers: [baseLayer, layer]
      });

      layer.setData({
        min: minEmissions,
        max: maxEmissions,
        data: data
      });
    });
  }, []);
  
  useEffect(() => {
    if(heatmapLayer) {
      console.log("Changing Subsector");
      let filteredData = data.filter(a => a.subsector_id === emissionSector);
      console.log(typeof emissionSector);
      heatmapLayer.setData({
        min: minEmissions,
        max: maxEmissions,
        data: filteredData
      });
    }
  }, [data, emissionSector]);

  // useEffect(() => setIsLoading(false), [data]);
  
  // Load EPA Data
  useEffect(() => {
    console.log("Fetching data");
    setIsLoading(true);
    setError(null);
    
    fetch("https://data.epa.gov/efservice/pub_facts_sector_ghg_emission/pub_dim_facility/co2e_emission/>/0/ROWS/0:100000/json").then(response => {
      if(response.ok) {
        return response.json();
      } else {
        throw response;
      }
    }).then(data => {
      setData(data);
      console.log(data);
      setIsLoading(false);
    }).catch(error => {
      setError(error);
      console.error(error);
    })
    
  }, []);

  return (
    <div className="App">
      <div id="content">
        <header id="page-header">
          <div id="header-title">
            <h1>Carbon Dioxide Emissions by Sector</h1>
          </div>
          <div id="option-bar">
            <select name="sector" onChange={e => setEmissionSector(parseInt(e.target.value))}>
              {Object.entries(Sectors).map(([key, val]) => (
                <option value={val} key={key}>{key}</option>
              ))}
            </select>
          </div>
        </header>
        <div id="loading-screen" className={isLoading? "" : "shrink"}>
          <img src="loading.gif" />
          <p>Loading...</p>
        </div>
        <div id="map"></div>
      </div>
    </div>
  );
}

export default App;
