import {renderToString} from "react-dom/server";
import {LandingPage, type LandingProps} from "../../components/vp/landing-page";

export function render(props: LandingProps) {
  return renderToString(<LandingPage {...props}/>);
}
