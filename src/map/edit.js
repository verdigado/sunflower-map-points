/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

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
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';

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
	const { lat, lng, zoom, height, mailTo } = attributes;
	const blockProps = useBlockProps( {
		className: 'row',
	} );

	const onChangeMailTo = ( input ) => {
		setAttributes( { mailTo: input === undefined ? '' : input } );
	};

	return (
		<div { ...blockProps }>
			{
				<>
					<Disabled>
						<ServerSideRender
							block={ 'sunflower-map-points/map' }
							attributes={ {
								lat,
								lng,
								zoom,
								height,
								mailTo,
							} }
						/>
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
							<NumberControl
								label="Height"
								value={ height }
								onChange={ ( value ) => {
									const parsed = parseInt( value );
									if ( parsed >= 100 && parsed <= 1000 ) {
										setAttributes( { height: parsed } );
									}
								} }
								min={ 100 }
								max={ 1000 }
							/>
							<TextControl
								label={ __(
									'Mail To',
									'sunflower-map-points-map'
								) }
								help={ __(
									'Mail form to this address instead of default receiver.',
									'sunflower-map-points-map'
								) }
								value={ mailTo }
								placeholder={ __(
									'default receiver',
									'sunflower-map-points-map'
								) }
								type="email"
								onChange={ onChangeMailTo }
							/>
						</PanelBody>
					</InspectorControls>
				</>
			}
		</div>
	);
}
