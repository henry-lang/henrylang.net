<script lang="ts">
    import {Canvas, OrbitControls, Three} from '@threlte/core'
    import {Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera, DirectionalLight, AmbientLight, Group, MeshStandardMaterial, CircleGeometry} from 'three'
    import { degToRad } from 'three/src/math/MathUtils';
</script>

<div>
	<Canvas>
		<Three type={PerspectiveCamera} makeDefault position={[10, 10, 10]} fov={24}>
			<OrbitControls maxPolarAngle={degToRad(80)} enableZoom={false} target={{ y: 0.5 }} />
		</Three>

		<Three type={DirectionalLight} castShadow position={[3, 10, 10]} />
		<Three type={DirectionalLight} position={[-3, 10, -10]} intensity={0.2} />
		<Three type={AmbientLight} intensity={0.2} />

		<!-- Cube -->
		<Three type={Group}>
			<Three type={Mesh} position.y={0.5} castShadow let:ref>
				<!-- Add interaction -->
				<Three type={BoxGeometry} />
				<Three type={MeshStandardMaterial} color="#333333" />
			</Three>
		</Three>

		<!-- Floor -->
		<Three type={Mesh} receiveShadow rotation.x={degToRad(-90)}>
			<Three type={CircleGeometry} args={[3, 72]} />
			<Three type={MeshStandardMaterial} color="white" />
		</Three>
	</Canvas>
</div>

<style>
	div {
		height: 100%;
		width: 100%;
	}
</style>
