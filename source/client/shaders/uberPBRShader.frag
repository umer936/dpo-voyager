//#define STANDARD

#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
uniform vec3 dipColor1;
uniform vec3 dipColor2;
uniform vec3 dipColor3;
uniform vec3 dipColor4;
uniform vec3 dipDirColor1;
uniform vec3 dipDirColor2;
uniform vec3 dipDirColor3;
uniform vec3 dipDirColor4;

#ifdef IOR
	uniform float ior;
#endif

#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;

	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif

	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif

#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif

#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif

#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;

	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif

	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif

#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;

	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif

varying vec3 vViewPosition;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>

#include <uv_pars_fragment>

// Zone map support
#if defined(USE_ZONEMAP)
	varying vec2 vZoneUv;
#endif

#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

#ifdef USE_ZONEMAP
	uniform sampler2D zoneMap;
#endif

#ifdef USE_AOMAP
    uniform vec3 aoMapMix;
#endif

#ifdef MODE_XRAY
    varying float vIntensity;
#endif

#ifdef CUT_PLANE
	#if !defined(USE_TRANSMISSION)
    	varying vec3 vWorldPosition;
	#endif
    uniform vec4 cutPlaneDirection;
    uniform vec3 cutPlaneColor;
#endif

void main() {
    #ifdef CUT_PLANE
        if (dot(vWorldPosition, cutPlaneDirection.xyz) < -cutPlaneDirection.w) {
            discard;
        }
    #endif

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	#ifdef CUT_PLANE
	    // on the cut surface (back facing fragments revealed), replace normal with cut plane direction
        if (!gl_FrontFacing) {
            normal = -cutPlaneDirection.xyz;
            diffuseColor.rgb = cutPlaneColor.rgb;
        }
	#endif

    #include <clearcoat_normal_fragment_begin>
    #include <clearcoat_normal_fragment_maps>
    #include <emissivemap_fragment>
	
	// accumulation
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	//#include <aomap_fragment>
	// REPLACED WITH
	#ifdef USE_AOMAP
	    // if cut plane is enabled, disable ambient occlusion on back facing fragments
	    #ifdef CUT_PLANE
            if (gl_FrontFacing) {
	    #endif

    	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
    	vec3 aoSample = vec3(texture2D(aoMap, vAoMapUv).r,texture2D(aoMap, vAoMapUv).r,texture2D(aoMap, vAoMapUv).r);
    	vec3 aoFactors = mix(vec3(1.0), aoSample, clamp(aoMapMix * aoMapIntensity, 0.0, 1.0));
    	float ambientOcclusion = aoFactors.x * aoFactors.y * aoFactors.z;
    	float ambientOcclusion2 = ambientOcclusion * ambientOcclusion;
    	reflectedLight.directDiffuse *= ambientOcclusion2;
    	reflectedLight.directSpecular *= ambientOcclusion;
    	//reflectedLight.indirectDiffuse *= ambientOcclusion;

    	#if defined( USE_CLEARCOAT ) 
			clearcoatSpecularIndirect *= ambientOcclusion;
		#endif

		#if defined( USE_SHEEN ) 
			sheenSpecularIndirect *= ambientOcclusion;
		#endif

		#if defined( USE_ENVMAP ) && defined( STANDARD )

			float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );

			reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );

		#endif

    	#ifdef CUT_PLANE
    	    }
    	#endif
    #endif

	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

	#include <transmission_fragment>

	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

    #ifdef USE_SHEEN

		// Sheen energy compensation approximation calculation can be found at the end of
		// https://drive.google.com/file/d/1T0D1VSyR4AllqIJTQAraEIzjlb5h4FKH/view?usp=sharing
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );

		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;

	#endif

	#ifdef USE_CLEARCOAT

		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );

		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );

		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;

	#endif

	#ifdef CUT_PLANE
	if (!gl_FrontFacing) {
		outgoingLight = cutPlaneColor.rgb;
	}
	#endif

	#include <opaque_fragment>

	#ifdef USE_ZONEMAP
		vec4 zoneColor = texture2D(zoneMap, vZoneUv);
		gl_FragColor += mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(zoneColor.rgb, 1.0), zoneColor.a);
	#endif

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

    #ifdef MODE_NORMALS
        gl_FragColor = vec4(vec3(normal * 0.5 + 0.5), 1.0);
    #endif

    #ifdef MODE_XRAY
        gl_FragColor = vec4(vec3(0.4, 0.7, 1.0) * vIntensity, 1.0);
    #endif

	#ifdef MODE_DIP
		float hypoteneuse = sqrt((normal.x * normal.x) + (normal.y * normal.y));
		float dip = abs(atan(hypoteneuse / normal.z));

		// Normalize dip to [0,1] range
		float normalizedDip = dip / (PI / 2.0f);

		// Map to colors for shader
		vec3 color;
		if (normalizedDip < 0.3333) {
			color = mix(dipColor1, dipColor2, normalizedDip * 3.0);
		} else if (normalizedDip < 0.6666) {
			color = mix(dipColor2, dipColor3, (normalizedDip - 0.3333) * 3.0);
		} else {
			color = mix(dipColor3, dipColor4, (normalizedDip - 0.6666) * 3.0);
		}

		gl_FragColor = vec4(color, 1.0);
	#endif


	#ifdef MODE_DIP_DIR
		float Nsign = normal.z < 0.0f ? -1.0f : 1.0f;

		float dipDir = atan(Nsign * normal.x, Nsign * normal.y);
		if (dipDir < 0.0f)
		{
			dipDir += (2.0f * PI);
		}
		
		// Normalize to [0,1] range
		float normalizedDipDir = dipDir / (2.0f * PI);

		// Map to colors for shader
		vec3 color;
		if (normalizedDipDir < 0.25) {
			color = mix(dipDirColor1, dipDirColor2, normalizedDipDir * 4.0);
		} else if (normalizedDipDir < 0.5) {
			color = mix(dipDirColor2, dipDirColor3, (normalizedDipDir - 0.25) * 4.0);
		} else if (normalizedDipDir < 0.75) {
			color = mix(dipDirColor3, dipDirColor4, (normalizedDipDir - 0.5) * 4.0);
		} else {
			color = mix(dipDirColor4, dipDirColor1, (normalizedDipDir - 0.75) * 4.0);
		}

		gl_FragColor = vec4(color, 1.0);
	#endif
}
