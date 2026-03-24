export interface OnInit {
	onInit(): void;
}

export interface OnStart {
	onStart(): void;
}

export interface FrameworkModule {
	readonly name: string;
	onInit?(): void;
	onStart?(): void;
	onDestroy?(): void;
}
