import ImageLayer from 'ol/layer/Image.js';
import Map from 'ol/Map.js';
import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import View from 'ol/View.js';
import { getCenter } from 'ol/extent.js';
import { defaults as defaultControls } from 'ol/control.js';

const extent = [0, 0, 256, 256];
const projection = new Projection({
  code: 'image',
  units: 'pixels',
  extent: extent,
});
const imageServerURL = 'http://localhost:8080/image_dir/';
let currentImageIndex = 0;
let images = [];
let ontology = {};

async function fetchImages() {
  try {
	const response = await fetch(imageServerURL);
	const html = await response.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	images = Array.from(doc.querySelectorAll('a[href]'))
	  .filter(link => /\.(jpg)$/i.test(link.getAttribute('href')))
	  .map(link => ({
		relativePath: link.getAttribute('href').substring(2),
		annotation: null,
	  }));
	createMap();
  } catch (error) {
	console.error('Error fetching image directory:', error);
  }
}

async function fetchOntology() {
	try {
		const ontologyUrl = imageServerURL + 'ontology.json'
		const response = await fetch(ontologyUrl);
		ontology = await response.json();
		createRadioButtons();
	  } catch (error) {
		console.error('Error fetching ontology:', error);
	  }
}

function createRadioButtons() {
	const radioContainer = document.getElementById('radio-button-menu');
	Object.keys(ontology).forEach((key) => {
		const attributes = ontology[key];
		const radioBtn = document.createElement('input');
		radioBtn.type = 'radio';
		radioBtn.name = 'annotation';
		radioBtn.value = key;
		radioBtn.id = key;
		const labelElement = document.createElement('label');
		labelElement.htmlFor = key;
		labelElement.textContent = attributes.display_name;
		labelElement.style.color = attributes.color;
		const lineBreak = document.createElement('br'); 
		radioContainer.appendChild(radioBtn);
		radioContainer.appendChild(labelElement);
		radioContainer.appendChild(lineBreak);
	});
}

function createMap() {
  const map = new Map({
	controls: defaultControls({ rotate: false }),
	layers: [
	  new ImageLayer({
		source: new Static({
		  url: imageServerURL + images[currentImageIndex].relativePath,
		  projection: projection,
		  imageExtent: extent,
		}),
	  }),
	],
	target: 'map',
	view: new View({
	  projection: projection,
	  center: getCenter(extent),
	  zoom: 1,
	  maxZoom: 8,
	}),
  });

  document.querySelector('.prev').addEventListener('click', showPreviousImage);
  document.querySelector('.next').addEventListener('click', showNextImage);
  document.querySelector('.download').addEventListener('click', downloadAnnotations)

  function showPreviousImage() {
	storeAnnotation(); 
	currentImageIndex--;
	if (currentImageIndex < 0) {
	  currentImageIndex = images.length - 1;
	}
	updateImage();
	displayAnnotation();
  }

  function showNextImage() {
	storeAnnotation();
	currentImageIndex++;
	if (currentImageIndex >= images.length) {
	  currentImageIndex = 0;
	}
	updateImage();
	displayAnnotation();
  }

  function updateImage() {
	if (currentImageIndex >= 0 && currentImageIndex < images.length) {
	  map.getLayers().getArray()[0].setSource(new Static({
		url: imageServerURL + images[currentImageIndex].relativePath,
		projection: projection,
		imageExtent: extent,
	  }));
	  map.getView().setZoom(1);
	  map.getView().setCenter(getCenter(extent));

	}
  }
}

function storeAnnotation() {
	const checkedRadio = document.querySelector('input[name=annotation]:checked');
	images[currentImageIndex].annotation = checkedRadio?.value || null;
}

function displayAnnotation() {
	if (images[currentImageIndex].annotation != null){
		document.getElementById(images[currentImageIndex].annotation).checked = true;
	}
	else {
		document.querySelectorAll('input[name=annotation]').forEach(button => {
			button.checked = false;
		});
	}
}

function downloadAnnotations() {
	storeAnnotation();
	const annotationsBlob = new Blob(
		[JSON.stringify(Object.fromEntries(images.map(image => 
			[image.relativePath, { label: image.annotation }]))).split(',').join(',\n')], 
		{ type: 'application/json' });	  
	let a = document.createElement('a');
	document.body.appendChild(a);
	a.style = 'display: none';
	let url = window.URL.createObjectURL(annotationsBlob);
	a.href = url;
	a.download = 'classifications.json';
	a.click();
	window.URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', function() {
	const userLoggedin = sessionStorage.getItem('userLoggedin')
	if (userLoggedin == null) {
	  window.location.href = 'login.html';
	}
	else {
		const loginInfoContainer = document.getElementById('login-info');
		loginInfoContainer.textContent = 'Logged in as ' + userLoggedin;
	}
  });

  document.querySelector('.sign-out').addEventListener('click', signOut)

  function signOut() {
	  sessionStorage.removeItem('userLoggedIn')
	  window.location.href = 'login.html';
  }

fetchImages();
fetchOntology();
