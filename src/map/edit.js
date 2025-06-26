/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';

import {
	Disabled,
	RangeControl,
	PanelBody,
	TextControl,
} from '@wordpress/components';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               React props.
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { lat, lng, zoom } = attributes;
	const blockProps = useBlockProps( {
		className: 'row',
	} );

	return (
		<div { ...blockProps }>
			{
				<>
					<Disabled>
						<div
							className="map-container"
							data-lat={ lat }
							data-lng={ lng }
							data-zoom={ zoom }
						>
							<div id="map" style={ { height: '600px' } }></div>
						</div>
					</Disabled>
				</>
			}
			{
				<>
					<InspectorControls>
						<PanelBody title="Karteneinstellungen">
							<TextControl
								label="Latitude"
								value={ lat }
								onChange={ ( val ) =>
									setAttributes( { lat: parseFloat( val ) } )
								}
							/>
							<TextControl
								label="Longitude"
								value={ lng }
								onChange={ ( val ) =>
									setAttributes( { lng: parseFloat( val ) } )
								}
							/>
							<RangeControl
								label="Zoom"
								value={ zoom }
								onChange={ ( val ) =>
									setAttributes( { zoom: val } )
								}
								min={ 1 }
								max={ 18 }
							/>
						</PanelBody>
					</InspectorControls>
				</>
			}
		</div>
	);
}
