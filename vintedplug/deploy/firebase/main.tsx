import {hydrateRoot} from "react-dom/client";
import {LandingPage, type LandingProps} from "../../components/vp/landing-page";
import "./base.css";
import "../../app/landing.css";

const root = document.getElementById("root")!;
hydrateRoot(root, <LandingPage independent availability={root.dataset.release as LandingProps["availability"]} appOrigin={root.dataset.origin}/>);
