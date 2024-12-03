/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMes, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
	
		this.colorLoc = gl.getUniformLocation(this.prog, 'color');
	
		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
	
		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
	
		this.numTriangles = 0;
	
		this.ambientIntensity = 0.5; // Default ambient intensity
		this.lightPosition = [0.0, 0.0, 1.0]; // Default light position
		this.diffuseIntensity = 0.7; // Default diffuse intensity
		this.specularIntensity = 0.5; // Default specular light intensity
		this.shininess = 32.0; // Default shininess
	}




	setSpecularLight(intensity) {
		this.specularIntensity = intensity;
		gl.useProgram(this.prog);
		gl.uniform1f(gl.getUniformLocation(this.prog, "specularIntensity"), this.specularIntensity);
	}
	
	setShininess(shininess) {
		this.shininess = shininess;
		gl.useProgram(this.prog);
		gl.uniform1f(gl.getUniformLocation(this.prog, "shininess"), this.shininess);
	}
	


	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
		this.normalLoc = gl.getAttribLocation(this.prog, "normal");

	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);
	
		// Pass the transformation matrix (MVP) to the shader
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
	
		// Set up vertex positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
	
		// Set up texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
	
		// Pass lighting parameters to the shader
		gl.uniform3fv(gl.getUniformLocation(this.prog, "lightPos"), this.lightPosition);
		gl.uniform1f(gl.getUniformLocation(this.prog, "ambient"), this.ambientIntensity);
		gl.uniform1f(gl.getUniformLocation(this.prog, "specularIntensity"), this.specularIntensity);
		gl.uniform1f(gl.getUniformLocation(this.prog, "shininess"), this.shininess);
	
		// Set up normals for lighting calculations
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
	
		// Update light position dynamically
		updateLightPos();
	
		// Draw the mesh
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
	
		// Set the texture image data
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img
		);
	
		// Set texture parameters
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			console.warn("Handling Non-Power-Of-2 Texture");
	
			// Handle NPOT textures by clamping and linear filtering
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}
	
		// Bind the texture to the shader program
		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}
	

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(enabled) {
		gl.useProgram(this.prog);
		gl.uniform1i(gl.getUniformLocation(this.prog, "enableLighting"), enabled ? 1 : 0);
	}
	
	
	
	
	setAmbientLight(intensity) {
		this.ambientIntensity = intensity;
		gl.useProgram(this.prog);
		gl.uniform1f(gl.getUniformLocation(this.prog, "ambientIntensity"), this.ambientIntensity);
	}

	setLightPosition(x, y, z) {
		this.lightPosition = [x, y, z];
		gl.useProgram(this.prog);
		gl.uniform3fv(gl.getUniformLocation(this.prog, "lightPosition"), this.lightPosition);
	}
	
	
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			varying vec3 v_fragPos;

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;
				v_fragPos = vec3(mvp * vec4(pos, 1.0));

				gl_Position = mvp * vec4(pos, 1.0);
			}`;

			const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform bool enableLighting;
			uniform sampler2D tex;
			uniform vec3 color; 
			uniform vec3 lightPos;
			uniform float ambient;
			uniform float specularIntensity; // Specular light intensity
			uniform float shininess;         // Shininess factor

			varying vec2 v_texCoord;
			varying vec3 v_normal;
			varying vec3 v_fragPos;

			void main()
			{
				vec3 ambientLight = ambient * vec3(1.0, 1.0, 1.0); // White ambient light
				vec3 diffuseLight = vec3(0.0); // Default diffuse light
				vec3 specularLight = vec3(0.0); // Default specular light

				if (enableLighting) {
					vec3 norm = normalize(v_normal); // Normalize the normal vector
					vec3 lightDir = normalize(lightPos - v_fragPos); // Calculate light direction

					// Diffuse component
					float diff = max(dot(norm, lightDir), 0.0);
					diffuseLight = diff * vec3(1.0, 1.0, 1.0); // White diffuse light

					// Specular component
					vec3 viewDir = normalize(-v_fragPos); // View direction (camera at origin)
					vec3 reflectDir = reflect(-lightDir, norm); // Reflect the light direction
					float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
					specularLight = specularIntensity * spec * vec3(1.0, 1.0, 1.0); // White specular light
				}

				// Base color from texture or default color
				vec4 baseColor = showTex ? texture2D(tex, v_texCoord) : vec4(color, 1.0);
				vec3 lighting = ambientLight + diffuseLight + specularLight;
				gl_FragColor = vec4(baseColor.rgb * lighting, baseColor.a);
			}`;


const keys = {};
function updateLightPos() {
	const translationSpeed = 0.1; // Adjust for smoother movement
	if (keys['ArrowUp']) meshDrawer.lightPosition[1] += translationSpeed; // Move up
	if (keys['ArrowDown']) meshDrawer.lightPosition[1] -= translationSpeed; // Move down
	if (keys['ArrowRight']) meshDrawer.lightPosition[0] += translationSpeed; // Move right
	if (keys['ArrowLeft']) meshDrawer.lightPosition[0] -= translationSpeed; // Move left
}

///////////////////////////////////////////////////////////////////////////////////
