import {
	ComponentFactoryResolver,
	ComponentRef,
	ReflectiveInjector,
	ViewContainerRef
} from "@angular/core";
import { ModalComponent } from "./modal.component";
import { Observable } from "rxjs/Rx";
import { ReplaySubject } from "rxjs/ReplaySubject";
import { Injectable } from "@angular/core";

@Injectable()
export class ModalService {
	public vcRef: ViewContainerRef;
	public componentRefs = new Array<ComponentRef<any>>();

	constructor(public resolver: ComponentFactoryResolver) {}

	registerViewContainerRef(vcRef: ViewContainerRef): void {
		this.vcRef = vcRef;
	}


	create<T>(data: {component: any, inputs?: any}) {
		const inputProviders = Object.keys(data.inputs).map(inputName => ({provide: inputName, useValue: data.inputs[inputName]}));
		const resolvedInputs = ReflectiveInjector.resolve(inputProviders);
		const injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.vcRef.parentInjector);
		const factory = this.resolver.resolveComponentFactory(data.component);
		const component = factory.create(injector);
		this.componentRefs.push(component);
		this.vcRef.insert(component.hostView);

		component.instance["destroy"] = () => {
			// find the component in the list and call distroy on it
			// this is necessary to keep componentRefs up to date
			let index = -1;
			for (let i = 0; i < this.componentRefs.length; i++) {
				if (this.componentRefs[i] === component) {
					index = i;
					break;
				}
			}
			// if found
			if (index >= 0) {
				this.destroy(index);
			}
		};
	}

	destroy(index: number = -1) {
		// return if nothing to destroy because it's already destroyed
		if (index >= this.componentRefs.length || this.componentRefs.length === 0) {
			return;
		}
		// on negative index destroy the last on the list (top modal)
		if (index < 0) {
			index = this.componentRefs.length - 1;
		}

		this.componentRefs[index].destroy();
		this.componentRefs.splice(index, 1);
	}
}


